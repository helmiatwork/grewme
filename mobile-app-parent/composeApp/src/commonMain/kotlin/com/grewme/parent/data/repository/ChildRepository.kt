package com.grewme.parent.data.repository

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import com.grewme.parent.data.api.GrewMeApi
import com.grewme.parent.data.local.db.GrewMeDatabase
import com.grewme.parent.domain.model.Child
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock

class ChildRepository(
    private val api: GrewMeApi,
    private val db: GrewMeDatabase,
) {
    fun getChildren(): Flow<List<Child>> =
        db.grewMeDatabaseQueries.selectAllChildren()
            .asFlow()
            .mapToList(Dispatchers.IO)
            .map { entities ->
                entities.map { Child(id = it.id, name = it.name, avatar = it.avatar) }
            }

    suspend fun refresh() {
        val response = api.getChildren()
        val now = Clock.System.now().toEpochMilliseconds()
        db.grewMeDatabaseQueries.transaction {
            db.grewMeDatabaseQueries.deleteAllChildren()
            response.students.forEach { dto ->
                db.grewMeDatabaseQueries.insertChild(
                    id = dto.id,
                    name = dto.name,
                    avatar = dto.avatar,
                    cached_at = now,
                )
            }
        }
    }
}
