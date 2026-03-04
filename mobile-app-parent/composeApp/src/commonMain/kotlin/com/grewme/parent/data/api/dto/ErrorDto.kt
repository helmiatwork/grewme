package com.grewme.parent.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiErrorResponse(
    val error: ApiErrorBody,
)

@Serializable
data class ApiErrorBody(
    val code: String,
    val message: String,
)
