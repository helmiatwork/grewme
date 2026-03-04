package com.grewme.parent.domain.model

data class ProgressEntry(
    val period: String,
    val reading: Double,
    val math: Double,
    val writing: Double,
    val logic: Double,
    val social: Double,
)
