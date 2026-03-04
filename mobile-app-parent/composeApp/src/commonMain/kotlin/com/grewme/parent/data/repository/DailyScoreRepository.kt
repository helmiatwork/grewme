package com.grewme.parent.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import com.grewme.parent.data.api.GrewMeApi
import com.grewme.parent.data.local.db.GrewMeDatabase
import com.grewme.parent.domain.model.DailyScore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock

class DailyScoreRepository(
    private val api: GrewMeApi,
    private val db: GrewMeDatabase,
) {
    fun getScores(studentId: Long): Flow<List<DailyScore>> =
        db.grewMeDatabaseQueries.selectDailyScoresByStudent(studentId)
            .asFlow()
            .mapToList(Dispatchers.IO)
            .map { entities ->
                entities.map {
                    DailyScore(
                        id = it.id,
                        studentId = it.student_id,
                        date = it.date,
                        skillCategory = it.skill_category,
                        score = it.score.toInt(),
                        notes = it.notes,
                    )
                }
            }

    suspend fun refresh(studentId: Long) {
        val response = api.getDailyScores(studentId)
        val now = Clock.System.now().toEpochMilliseconds()
        db.grewMeDatabaseQueries.transaction {
            db.grewMeDatabaseQueries.deleteDailyScoresByStudent(studentId)
            response.dailyScores.forEach { dto ->
                db.grewMeDatabaseQueries.insertDailyScore(
                    id = dto.id,
                    student_id = dto.studentId,
                    date = dto.date,
                    skill_category = dto.skillCategory,
                    score = dto.score.toLong(),
                    notes = dto.notes,
                    cached_at = now,
                )
            }
        }
    }
}
