package com.grewme.parent.domain.model

data class DailyScore(
    val id: Long,
    val studentId: Long,
    val date: String,
    val skillCategory: String,
    val score: Int,
    val notes: String? = null,
)
