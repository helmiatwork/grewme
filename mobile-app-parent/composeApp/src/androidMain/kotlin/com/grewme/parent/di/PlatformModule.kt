package com.grewme.parent.di

import com.grewme.parent.data.local.db.DatabaseDriverFactory
import com.grewme.parent.data.local.token.TokenStorage
import io.ktor.client.engine.okhttp.*
import org.koin.dsl.module

actual val platformModule = module {
    single { OkHttp.create() }
    single { TokenStorage(get()) }
    single { DatabaseDriverFactory(get()).create() }
}
