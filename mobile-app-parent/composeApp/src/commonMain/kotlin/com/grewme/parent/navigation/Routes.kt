package com.grewme.parent.navigation

import kotlinx.serialization.Serializable

@Serializable object LoginRoute
@Serializable object ChildrenRoute
@Serializable data class ChildDetailRoute(val childId: Long, val childName: String)
