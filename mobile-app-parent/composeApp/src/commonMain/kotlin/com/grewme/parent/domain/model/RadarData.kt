package com.grewme.parent.domain.model

data class RadarData(
    val studentId: Long,
    val studentName: String,
    val reading: Double,
    val math: Double,
    val writing: Double,
    val logic: Double,
    val social: Double,
    val totalDaysScored: Int? = null,
)
