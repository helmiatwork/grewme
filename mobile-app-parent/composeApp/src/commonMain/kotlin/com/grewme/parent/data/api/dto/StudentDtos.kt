package com.grewme.parent.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class StudentsResponse(
    val students: List<StudentDto>,
)

@Serializable
data class StudentDto(
    val id: Long,
    val name: String,
    val avatar: String? = null,
)
