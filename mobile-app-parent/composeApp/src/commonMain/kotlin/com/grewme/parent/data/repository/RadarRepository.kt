package com.grewme.parent.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.grewme.parent.data.api.GrewMeApi
import com.grewme.parent.data.local.db.GrewMeDatabase
import com.grewme.parent.domain.model.RadarData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock

class RadarRepository(
    private val api: GrewMeApi,
    private val db: GrewMeDatabase,
) {
    fun getRadarData(studentId: Long): Flow<RadarData?> =
        db.grewMeDatabaseQueries.selectRadarData(studentId)
            .asFlow()
            .mapToOneOrNull(Dispatchers.IO)
            .map { entity ->
                entity?.let {
                    RadarData(
                        studentId = it.student_id,
                        studentName = it.student_name,
                        reading = it.reading ?: 0.0,
                        math = it.math ?: 0.0,
                        writing = it.writing ?: 0.0,
                        logic = it.logic ?: 0.0,
                        social = it.social ?: 0.0,
                        totalDaysScored = it.total_days_scored?.toInt(),
                    )
                }
            }

    suspend fun refresh(studentId: Long) {
        val response = api.getRadarData(studentId)
        val now = Clock.System.now().toEpochMilliseconds()
        val radar = response.radar
        db.grewMeDatabaseQueries.insertRadarData(
            student_id = radar.studentId,
            student_name = radar.studentName,
            reading = radar.skills.reading,
            math = radar.skills.math,
            writing = radar.skills.writing,
            logic = radar.skills.logic,
            social = radar.skills.social,
            total_days_scored = radar.totalDaysScored?.toLong(),
            cached_at = now,
        )
    }
}
