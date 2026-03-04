package com.grewme.parent.data.api

import com.grewme.parent.data.api.dto.AuthResponse
import com.grewme.parent.data.api.dto.RefreshRequest
import com.grewme.parent.data.local.token.TokenStorage
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

class HttpClientFactory(
    private val engine: HttpClientEngine,
    private val tokenStorage: TokenStorage,
    private val baseUrl: String = "http://localhost:3001/api/v1/",
) {
    fun create(): HttpClient = HttpClient(engine) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
            })
        }

        defaultRequest {
            url(baseUrl)
            contentType(ContentType.Application.Json)
        }

        install(Auth) {
            bearer {
                loadTokens {
                    val access = tokenStorage.getAccessToken()
                    val refresh = tokenStorage.getRefreshToken()
                    if (access != null && refresh != null) {
                        BearerTokens(access, refresh)
                    } else null
                }

                refreshTokens {
                    val response = client.post("auth/refresh") {
                        markAsRefreshTokenRequest()
                        setBody(RefreshRequest(oldTokens?.refreshToken ?: ""))
                    }
                    val tokens: AuthResponse = response.body()
                    tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken)
                    BearerTokens(tokens.accessToken, tokens.refreshToken)
                }

                sendWithoutRequest { request ->
                    !request.url.encodedPath.contains("auth/login") &&
                    !request.url.encodedPath.contains("auth/register") &&
                    !request.url.encodedPath.contains("auth/refresh")
                }
            }
        }

        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 15_000
        }

        HttpResponseValidator {
            handleResponseExceptionWithRequest { exception, _ ->
                when (exception) {
                    is ClientRequestException -> {
                        when (exception.response.status) {
                            HttpStatusCode.Unauthorized -> throw AuthException("Session expired")
                            HttpStatusCode.Forbidden -> throw ForbiddenException("Access denied")
                            HttpStatusCode.NotFound -> throw NotFoundException("Resource not found")
                            else -> throw ApiException("Error: ${exception.response.status.value}")
                        }
                    }
                    is ServerResponseException ->
                        throw ApiException("Server error: ${exception.response.status.value}")
                }
            }
        }
    }
}
