package com.grewme.parent.data.api

import com.grewme.parent.data.api.dto.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*

class GrewMeApi(private val client: HttpClient) {

    suspend fun login(email: String, password: String): AuthResponse =
        client.post("auth/login") {
            setBody(LoginRequest(email, password))
        }.body()

    suspend fun getChildren(): StudentsResponse =
        client.get("parents/children").body()

    suspend fun getRadarData(studentId: Long): RadarResponse =
        client.get("students/$studentId/radar").body()

    suspend fun getProgress(studentId: Long): ProgressResponse =
        client.get("students/$studentId/progress").body()

    suspend fun getDailyScores(studentId: Long): DailyScoresResponse =
        client.get("students/$studentId/daily_scores").body()
}
