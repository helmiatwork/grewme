package com.grewme.parent.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import com.grewme.parent.data.api.GrewMeApi
import com.grewme.parent.data.local.db.GrewMeDatabase
import com.grewme.parent.domain.model.ProgressEntry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock

class ProgressRepository(
    private val api: GrewMeApi,
    private val db: GrewMeDatabase,
) {
    fun getProgress(studentId: Long): Flow<List<ProgressEntry>> =
        db.grewMeDatabaseQueries.selectProgressByStudent(studentId)
            .asFlow()
            .mapToList(Dispatchers.IO)
            .map { entities ->
                entities.map {
                    ProgressEntry(
                        period = it.period,
                        reading = it.reading ?: 0.0,
                        math = it.math ?: 0.0,
                        writing = it.writing ?: 0.0,
                        logic = it.logic ?: 0.0,
                        social = it.social ?: 0.0,
                    )
                }
            }

    suspend fun refresh(studentId: Long) {
        val response = api.getProgress(studentId)
        val now = Clock.System.now().toEpochMilliseconds()
        db.grewMeDatabaseQueries.transaction {
            db.grewMeDatabaseQueries.deleteProgressByStudent(studentId)
            response.progress.forEach { dto ->
                db.grewMeDatabaseQueries.insertProgressEntry(
                    student_id = studentId,
                    period = dto.period,
                    reading = dto.skills.reading,
                    math = dto.skills.math,
                    writing = dto.skills.writing,
                    logic = dto.skills.logic,
                    social = dto.skills.social,
                    cached_at = now,
                )
            }
        }
    }
}
