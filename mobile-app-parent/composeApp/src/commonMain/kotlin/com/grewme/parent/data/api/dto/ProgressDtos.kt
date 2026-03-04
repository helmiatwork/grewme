package com.grewme.parent.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class ProgressResponse(
    val progress: List<ProgressEntryDto>,
)

@Serializable
data class ProgressEntryDto(
    val period: String,
    val skills: SkillsDto,
)
