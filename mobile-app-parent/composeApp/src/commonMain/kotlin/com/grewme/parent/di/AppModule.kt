package com.grewme.parent.di

import com.grewme.parent.data.api.GrewMeApi
import com.grewme.parent.data.api.HttpClientFactory
import com.grewme.parent.data.local.db.GrewMeDatabase
import com.grewme.parent.data.repository.ChildRepository
import com.grewme.parent.data.repository.DailyScoreRepository
import com.grewme.parent.data.repository.ProgressRepository
import com.grewme.parent.data.repository.RadarRepository
import com.grewme.parent.ui.auth.LoginViewModel
import com.grewme.parent.ui.children.ChildrenViewModel
import com.grewme.parent.ui.child.ChildRadarViewModel
import com.grewme.parent.ui.child.ChildProgressViewModel
import com.grewme.parent.ui.child.ChildHistoryViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val appModule = module {
    // Network
    single { HttpClientFactory(engine = get(), tokenStorage = get()).create() }
    single { GrewMeApi(get()) }

    // Database
    single { GrewMeDatabase(get()) }

    // Repositories
    single { ChildRepository(get(), get()) }
    single { RadarRepository(get(), get()) }
    single { DailyScoreRepository(get(), get()) }
    single { ProgressRepository(get(), get()) }

    // ViewModels
    viewModel { LoginViewModel(get(), get()) }
    viewModel { ChildrenViewModel(get()) }
    viewModel { params -> ChildRadarViewModel(params.get(), get()) }
    viewModel { params -> ChildProgressViewModel(params.get(), get()) }
    viewModel { params -> ChildHistoryViewModel(params.get(), get()) }
}
