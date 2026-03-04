package com.grewme.parent.data.api.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DailyScoresResponse(
    @SerialName("daily_scores") val dailyScores: List<DailyScoreDto>,
)

@Serializable
data class DailyScoreDto(
    val id: Long,
    val date: String,
    @SerialName("skill_category") val skillCategory: String,
    val score: Int,
    val notes: String? = null,
    @SerialName("student_id") val studentId: Long,
)
