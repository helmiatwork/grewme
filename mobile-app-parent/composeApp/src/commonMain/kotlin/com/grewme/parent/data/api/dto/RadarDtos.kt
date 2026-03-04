package com.grewme.parent.data.api.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RadarResponse(
    val radar: RadarDto,
)

@Serializable
data class RadarDto(
    @SerialName("student_id") val studentId: Long,
    @SerialName("student_name") val studentName: String,
    val skills: SkillsDto,
    @SerialName("total_days_scored") val totalDaysScored: Int? = null,
)

@Serializable
data class SkillsDto(
    val reading: Double? = null,
    val math: Double? = null,
    val writing: Double? = null,
    val logic: Double? = null,
    val social: Double? = null,
)
