package com.grewme.parent.di

import com.grewme.parent.data.local.db.DatabaseDriverFactory
import com.grewme.parent.data.local.token.TokenStorage
import io.ktor.client.engine.darwin.*
import org.koin.dsl.module

actual val platformModule = module {
    single { Darwin.create() }
    single { TokenStorage() }
    single { DatabaseDriverFactory().create() }
}
