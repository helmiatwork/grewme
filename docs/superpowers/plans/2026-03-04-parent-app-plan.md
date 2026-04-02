# Parent Mobile App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the GrewMe parent mobile app with login, children list, radar chart, progress trends, score history, and offline cache — iOS-first.

**Architecture:** MVVM with Koin DI. Ktor for networking with bearer auth auto-refresh. SQLDelight for offline cache (cache-first reads). Custom Compose Canvas radar chart. Type-safe navigation with auth guard.

**Tech Stack:** Kotlin 2.1.0, Compose Multiplatform 1.7.3, Ktor 3.0.3, Koin 4.0.0, SQLDelight, Navigation Compose 2.8.0-alpha10

**Working Directory:** `/Users/theresiaputri/repo/grewme/mobile-app-parent`

**Backend API base:** `http://localhost:3001/api/v1/` (dev), configurable

---

### Task 1: Gradle Setup — Add SQLDelight, Ktor Auth, Update Dependencies

**Files:**
- Modify: `gradle/libs.versions.toml`
- Modify: `composeApp/build.gradle.kts`
- Modify: `settings.gradle.kts` (if needed for SQLDelight)

**Step 1: Update `gradle/libs.versions.toml`**

Add these versions and libraries:

```toml
[versions]
agp = "8.7.3"
kotlin = "2.1.0"
compose-multiplatform = "1.7.3"
androidx-activityCompose = "1.9.3"
androidx-lifecycle = "2.8.4"
kotlinx-coroutines = "1.9.0"
kotlinx-serialization = "1.7.3"
ktor = "3.0.3"
koin = "4.0.0"
navigation = "2.8.0-alpha10"
sqldelight = "2.0.2"
kotlinx-datetime = "0.6.1"

[libraries]
androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "androidx-activityCompose" }
androidx-lifecycle-viewmodel = { module = "org.jetbrains.androidx.lifecycle:lifecycle-viewmodel", version.ref = "androidx-lifecycle" }
androidx-lifecycle-runtime-compose = { module = "org.jetbrains.androidx.lifecycle:lifecycle-runtime-compose", version.ref = "androidx-lifecycle" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinx-coroutines" }
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinx-serialization" }
kotlinx-datetime = { module = "org.jetbrains.kotlinx:kotlinx-datetime", version.ref = "kotlinx-datetime" }
ktor-client-core = { module = "io.ktor:ktor-client-core", version.ref = "ktor" }
ktor-client-okhttp = { module = "io.ktor:ktor-client-okhttp", version.ref = "ktor" }
ktor-client-darwin = { module = "io.ktor:ktor-client-darwin", version.ref = "ktor" }
ktor-client-content-negotiation = { module = "io.ktor:ktor-client-content-negotiation", version.ref = "ktor" }
ktor-serialization-kotlinx-json = { module = "io.ktor:ktor-serialization-kotlinx-json", version.ref = "ktor" }
ktor-client-auth = { module = "io.ktor:ktor-client-auth", version.ref = "ktor" }
koin-core = { module = "io.insert-koin:koin-core", version.ref = "koin" }
koin-compose = { module = "io.insert-koin:koin-compose", version.ref = "koin" }
koin-compose-viewmodel = { module = "io.insert-koin:koin-compose-viewmodel", version.ref = "koin" }
navigation-compose = { module = "org.jetbrains.androidx.navigation:navigation-compose", version.ref = "navigation" }
sqldelight-coroutines = { module = "app.cash.sqldelight:coroutines-extensions", version.ref = "sqldelight" }
sqldelight-android-driver = { module = "app.cash.sqldelight:android-driver", version.ref = "sqldelight" }
sqldelight-native-driver = { module = "app.cash.sqldelight:native-driver", version.ref = "sqldelight" }

[plugins]
androidApplication = { id = "com.android.application", version.ref = "agp" }
androidLibrary = { id = "com.android.library", version.ref = "agp" }
composeMultiplatform = { id = "org.jetbrains.compose", version.ref = "compose-multiplatform" }
composeCompiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
kotlinMultiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
kotlinxSerialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
sqldelight = { id = "app.cash.sqldelight", version.ref = "sqldelight" }
```

**Step 2: Update `composeApp/build.gradle.kts`**

Add SQLDelight plugin and dependencies:

```kotlin
import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinxSerialization)
    alias(libs.plugins.sqldelight)
}

kotlin {
    androidTarget {
        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }

    sourceSets {
        androidMain.dependencies {
            implementation(libs.androidx.activity.compose)
            implementation(libs.ktor.client.okhttp)
            implementation(libs.sqldelight.android.driver)
        }
        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(compose.components.uiToolingPreview)
            implementation(libs.androidx.lifecycle.viewmodel)
            implementation(libs.androidx.lifecycle.runtime.compose)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.ktor.client.auth)
            implementation(libs.koin.core)
            implementation(libs.koin.compose)
            implementation(libs.koin.compose.viewmodel)
            implementation(libs.navigation.compose)
            implementation(libs.sqldelight.coroutines)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
            implementation(libs.sqldelight.native.driver)
        }
    }
}

sqldelight {
    databases {
        create("GrewMeDatabase") {
            packageName.set("com.grewme.parent.data.local.db")
        }
    }
}

android {
    namespace = "com.grewme.parent"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.grewme.parent"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
```

**Step 3: Verify build compiles**

Run:
```bash
cd /Users/theresiaputri/repo/grewme/mobile-app-parent && ./gradlew composeApp:compileKotlinIosSimulatorArm64 --no-daemon 2>&1 | tail -20
```

Note: This may fail until SQLDelight .sq files exist (Task 3). That's OK — just verify Gradle resolves dependencies.

**Step 4: Commit**

```bash
git add -A && git commit -m "build(parent-app): add SQLDelight, Ktor Auth, kotlinx-datetime dependencies"
```

---

### Task 2: Data Layer — DTOs, API Client, Exceptions, Token Storage

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/` (6 DTO files)
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/GrewMeApi.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/HttpClientFactory.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/AppException.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/local/token/TokenStorage.kt` (expect)
- Create: `composeApp/src/iosMain/kotlin/com/grewme/parent/data/local/token/IosTokenStorage.kt` (actual)
- Create: `composeApp/src/androidMain/kotlin/com/grewme/parent/data/local/token/AndroidTokenStorage.kt` (actual)

**Step 1: Create DTOs matching backend API responses**

The backend returns these JSON shapes:

Login response: `{ access_token, refresh_token, expires_in, user: { id, name, email, role } }`
Children: `{ students: [{ id, name, avatar }] }`
Radar: `{ radar: { student_id, student_name, skills: { reading, math, writing, logic, social }, total_days_scored } }`
Progress: `{ progress: [{ period, skills: { reading, math, writing, logic, social } }] }`
Daily scores: `{ daily_scores: [{ id, date, skill_category, score, notes, student_id }] }`
Error: `{ error: { code, message } }`

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/AuthDtos.kt
package com.grewme.parent.data.api.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RefreshRequest(
    @SerialName("refresh_token") val refreshToken: String,
)

@Serializable
data class AuthResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expires_in") val expiresIn: Long,
    val user: UserDto? = null,
)

@Serializable
data class UserDto(
    val id: Long,
    val name: String,
    val email: String,
    val role: String,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/StudentDtos.kt
package com.grewme.parent.data.api.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class StudentsResponse(
    val students: List<StudentDto>,
)

@Serializable
data class StudentDto(
    val id: Long,
    val name: String,
    val avatar: String? = null,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/RadarDtos.kt
package com.grewme.parent.data.api.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RadarResponse(
    val radar: RadarDto,
)

@Serializable
data class RadarDto(
    @SerialName("student_id") val studentId: Long,
    @SerialName("student_name") val studentName: String,
    val skills: SkillsDto,
    @SerialName("total_days_scored") val totalDaysScored: Int? = null,
)

@Serializable
data class SkillsDto(
    val reading: Double? = null,
    val math: Double? = null,
    val writing: Double? = null,
    val logic: Double? = null,
    val social: Double? = null,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/ProgressDtos.kt
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
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/DailyScoreDtos.kt
package com.grewme.parent.data.api.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DailyScoresResponse(
    @SerialName("daily_scores") val dailyScores: List<DailyScoreDto>,
)

@Serializable
data class DailyScoreDto(
    val id: Long,
    val date: String,
    @SerialName("skill_category") val skillCategory: String,
    val score: Int,
    val notes: String? = null,
    @SerialName("student_id") val studentId: Long,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/dto/ErrorDto.kt
package com.grewme.parent.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiErrorResponse(
    val error: ApiErrorBody,
)

@Serializable
data class ApiErrorBody(
    val code: String,
    val message: String,
)
```

**Step 2: Create exception hierarchy**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/AppException.kt
package com.grewme.parent.data.api

sealed class AppException(message: String, cause: Throwable? = null) : Exception(message, cause)
class AuthException(message: String) : AppException(message)
class ForbiddenException(message: String) : AppException(message)
class NotFoundException(message: String) : AppException(message)
class ApiException(message: String) : AppException(message)
class NetworkException(message: String, cause: Throwable) : AppException(message, cause)
```

**Step 3: Create TokenStorage expect/actual**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/local/token/TokenStorage.kt
package com.grewme.parent.data.local.token

expect class TokenStorage {
    fun saveTokens(accessToken: String, refreshToken: String)
    fun getAccessToken(): String?
    fun getRefreshToken(): String?
    fun clearTokens()
}
```

```kotlin
// composeApp/src/iosMain/kotlin/com/grewme/parent/data/local/token/IosTokenStorage.kt
package com.grewme.parent.data.local.token

import platform.Foundation.NSUserDefaults

actual class TokenStorage {
    private val defaults = NSUserDefaults.standardUserDefaults

    actual fun saveTokens(accessToken: String, refreshToken: String) {
        defaults.setObject(accessToken, forKey = KEY_ACCESS)
        defaults.setObject(refreshToken, forKey = KEY_REFRESH)
    }

    actual fun getAccessToken(): String? =
        defaults.stringForKey(KEY_ACCESS)

    actual fun getRefreshToken(): String? =
        defaults.stringForKey(KEY_REFRESH)

    actual fun clearTokens() {
        defaults.removeObjectForKey(KEY_ACCESS)
        defaults.removeObjectForKey(KEY_REFRESH)
    }

    companion object {
        private const val KEY_ACCESS = "grewme_access_token"
        private const val KEY_REFRESH = "grewme_refresh_token"
    }
}
```

```kotlin
// composeApp/src/androidMain/kotlin/com/grewme/parent/data/local/token/AndroidTokenStorage.kt
package com.grewme.parent.data.local.token

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

actual class TokenStorage(context: Context) {
    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "grewme_tokens",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    actual fun saveTokens(accessToken: String, refreshToken: String) {
        prefs.edit().putString(KEY_ACCESS, accessToken).putString(KEY_REFRESH, refreshToken).apply()
    }

    actual fun getAccessToken(): String? = prefs.getString(KEY_ACCESS, null)
    actual fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH, null)

    actual fun clearTokens() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
    }
}
```

Note: Android EncryptedSharedPreferences requires `androidx.security:security-crypto`. Add to libs.versions.toml if not present:
```toml
androidx-security-crypto = { module = "androidx.security:security-crypto", version = "1.1.0-alpha06" }
```
And in androidMain dependencies:
```kotlin
implementation(libs.androidx.security.crypto)
```

For iOS, we use NSUserDefaults for simplicity (Keychain can be added later for production security).

**Step 4: Create HttpClientFactory**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/HttpClientFactory.kt
package com.grewme.parent.data.api

import com.grewme.parent.data.api.dto.AuthResponse
import com.grewme.parent.data.api.dto.RefreshRequest
import com.grewme.parent.data.local.token.TokenStorage
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

class HttpClientFactory(
    private val engine: HttpClientEngine,
    private val tokenStorage: TokenStorage,
    private val baseUrl: String = "http://localhost:3001/api/v1/",
) {
    fun create(): HttpClient = HttpClient(engine) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
            })
        }

        defaultRequest {
            url(baseUrl)
            contentType(ContentType.Application.Json)
        }

        install(Auth) {
            bearer {
                loadTokens {
                    val access = tokenStorage.getAccessToken()
                    val refresh = tokenStorage.getRefreshToken()
                    if (access != null && refresh != null) {
                        BearerTokens(access, refresh)
                    } else null
                }

                refreshTokens {
                    val response = client.post("auth/refresh") {
                        markAsRefreshTokenRequest()
                        setBody(RefreshRequest(oldTokens?.refreshToken ?: ""))
                    }
                    val tokens: AuthResponse = response.body()
                    tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken)
                    BearerTokens(tokens.accessToken, tokens.refreshToken)
                }

                sendWithoutRequest { request ->
                    !request.url.encodedPath.contains("auth/login") &&
                    !request.url.encodedPath.contains("auth/register") &&
                    !request.url.encodedPath.contains("auth/refresh")
                }
            }
        }

        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 15_000
        }

        HttpResponseValidator {
            handleResponseExceptionWithRequest { exception, _ ->
                when (exception) {
                    is ClientRequestException -> {
                        when (exception.response.status) {
                            HttpStatusCode.Unauthorized -> throw AuthException("Session expired")
                            HttpStatusCode.Forbidden -> throw ForbiddenException("Access denied")
                            HttpStatusCode.NotFound -> throw NotFoundException("Resource not found")
                            else -> throw ApiException("Error: ${exception.response.status.value}")
                        }
                    }
                    is ServerResponseException ->
                        throw ApiException("Server error: ${exception.response.status.value}")
                }
            }
        }
    }
}
```

**Step 5: Create GrewMeApi**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/api/GrewMeApi.kt
package com.grewme.parent.data.api

import com.grewme.parent.data.api.dto.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*

class GrewMeApi(private val client: HttpClient) {

    suspend fun login(email: String, password: String): AuthResponse =
        client.post("auth/login") {
            setBody(LoginRequest(email, password))
        }.body()

    suspend fun getChildren(): StudentsResponse =
        client.get("parents/children").body()

    suspend fun getRadarData(studentId: Long): RadarResponse =
        client.get("students/$studentId/radar").body()

    suspend fun getProgress(studentId: Long): ProgressResponse =
        client.get("students/$studentId/progress").body()

    suspend fun getDailyScores(studentId: Long): DailyScoresResponse =
        client.get("students/$studentId/daily_scores").body()
}
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add data layer — DTOs, API client, token storage, exceptions"
```

---

### Task 3: SQLDelight — Schema, Queries, Database Driver

**Files:**
- Create: `composeApp/src/commonMain/sqldelight/com/grewme/parent/data/local/db/GrewMeDatabase.sq`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/local/db/DatabaseDriverFactory.kt` (expect)
- Create: `composeApp/src/iosMain/kotlin/com/grewme/parent/data/local/db/IosDatabaseDriverFactory.kt` (actual)
- Create: `composeApp/src/androidMain/kotlin/com/grewme/parent/data/local/db/AndroidDatabaseDriverFactory.kt` (actual)

**Step 1: Create SQLDelight schema**

```sql
-- composeApp/src/commonMain/sqldelight/com/grewme/parent/data/local/db/GrewMeDatabase.sq

-- Children
CREATE TABLE child (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    cached_at INTEGER NOT NULL
);

insertChild:
INSERT OR REPLACE INTO child(id, name, avatar, cached_at)
VALUES (?, ?, ?, ?);

selectAllChildren:
SELECT * FROM child ORDER BY name ASC;

deleteAllChildren:
DELETE FROM child;

-- Radar Data
CREATE TABLE radar_data (
    student_id INTEGER NOT NULL PRIMARY KEY,
    student_name TEXT NOT NULL,
    reading REAL,
    math REAL,
    writing REAL,
    logic REAL,
    social REAL,
    total_days_scored INTEGER,
    cached_at INTEGER NOT NULL
);

insertRadarData:
INSERT OR REPLACE INTO radar_data(student_id, student_name, reading, math, writing, logic, social, total_days_scored, cached_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

selectRadarData:
SELECT * FROM radar_data WHERE student_id = ?;

-- Daily Scores
CREATE TABLE daily_score (
    id INTEGER NOT NULL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    skill_category TEXT NOT NULL,
    score INTEGER NOT NULL,
    notes TEXT,
    cached_at INTEGER NOT NULL
);

insertDailyScore:
INSERT OR REPLACE INTO daily_score(id, student_id, date, skill_category, score, notes, cached_at)
VALUES (?, ?, ?, ?, ?, ?, ?);

selectDailyScoresByStudent:
SELECT * FROM daily_score WHERE student_id = ? ORDER BY date DESC, skill_category ASC;

deleteDailyScoresByStudent:
DELETE FROM daily_score WHERE student_id = ?;

-- Progress Data
CREATE TABLE progress_entry (
    student_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    reading REAL,
    math REAL,
    writing REAL,
    logic REAL,
    social REAL,
    cached_at INTEGER NOT NULL,
    PRIMARY KEY (student_id, period)
);

insertProgressEntry:
INSERT OR REPLACE INTO progress_entry(student_id, period, reading, math, writing, logic, social, cached_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

selectProgressByStudent:
SELECT * FROM progress_entry WHERE student_id = ? ORDER BY period ASC;

deleteProgressByStudent:
DELETE FROM progress_entry WHERE student_id = ?;
```

**Step 2: Create DatabaseDriverFactory expect/actual**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/local/db/DatabaseDriverFactory.kt
package com.grewme.parent.data.local.db

import app.cash.sqldelight.db.SqlDriver

expect class DatabaseDriverFactory {
    fun create(): SqlDriver
}
```

```kotlin
// composeApp/src/iosMain/kotlin/com/grewme/parent/data/local/db/IosDatabaseDriverFactory.kt
package com.grewme.parent.data.local.db

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

actual class DatabaseDriverFactory {
    actual fun create(): SqlDriver =
        NativeSqliteDriver(GrewMeDatabase.Schema, "grewme_parent.db")
}
```

```kotlin
// composeApp/src/androidMain/kotlin/com/grewme/parent/data/local/db/AndroidDatabaseDriverFactory.kt
package com.grewme.parent.data.local.db

import android.content.Context
import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.android.AndroidSqliteDriver

actual class DatabaseDriverFactory(private val context: Context) {
    actual fun create(): SqlDriver =
        AndroidSqliteDriver(GrewMeDatabase.Schema, context, "grewme_parent.db")
}
```

**Step 3: Verify SQLDelight generates code**

Run:
```bash
cd /Users/theresiaputri/repo/grewme/mobile-app-parent && ./gradlew composeApp:generateCommonMainGrewMeDatabaseInterface --no-daemon 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add SQLDelight schema and database drivers"
```

---

### Task 4: Domain Models + Repositories (Cache-First)

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/domain/model/` (4 model files)
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/data/repository/` (4 repository files)

**Step 1: Create domain models**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/domain/model/Child.kt
package com.grewme.parent.domain.model

data class Child(
    val id: Long,
    val name: String,
    val avatar: String? = null,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/domain/model/RadarData.kt
package com.grewme.parent.domain.model

data class RadarData(
    val studentId: Long,
    val studentName: String,
    val reading: Double,
    val math: Double,
    val writing: Double,
    val logic: Double,
    val social: Double,
    val totalDaysScored: Int? = null,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/domain/model/DailyScore.kt
package com.grewme.parent.domain.model

data class DailyScore(
    val id: Long,
    val studentId: Long,
    val date: String,
    val skillCategory: String,
    val score: Int,
    val notes: String? = null,
)
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/domain/model/ProgressEntry.kt
package com.grewme.parent.domain.model

data class ProgressEntry(
    val period: String,
    val reading: Double,
    val math: Double,
    val writing: Double,
    val logic: Double,
    val social: Double,
)
```

**Step 2: Create repositories**

Each repository follows the cache-first pattern: expose a Flow from SQLDelight for instant UI, provide a `refresh()` suspend function that fetches from API and upserts into SQLDelight.

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/repository/ChildRepository.kt
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
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/repository/RadarRepository.kt
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
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/repository/DailyScoreRepository.kt
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
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/data/repository/ProgressRepository.kt
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
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add domain models and cache-first repositories"
```

---

### Task 5: Koin DI Modules

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/di/AppModule.kt`
- Create: `composeApp/src/iosMain/kotlin/com/grewme/parent/di/PlatformModule.kt`
- Create: `composeApp/src/androidMain/kotlin/com/grewme/parent/di/PlatformModule.kt`

**Step 1: Create common Koin module**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/di/AppModule.kt
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
```

**Step 2: Create iOS platform module**

```kotlin
// composeApp/src/iosMain/kotlin/com/grewme/parent/di/PlatformModule.kt
package com.grewme.parent.di

import com.grewme.parent.data.local.db.DatabaseDriverFactory
import com.grewme.parent.data.local.token.TokenStorage
import io.ktor.client.engine.darwin.*
import org.koin.dsl.module

val platformModule = module {
    single { Darwin.create() }
    single { TokenStorage() }
    single { DatabaseDriverFactory().create() }
}
```

**Step 3: Create Android platform module**

```kotlin
// composeApp/src/androidMain/kotlin/com/grewme/parent/di/PlatformModule.kt
package com.grewme.parent.di

import com.grewme.parent.data.local.db.DatabaseDriverFactory
import com.grewme.parent.data.local.token.TokenStorage
import io.ktor.client.engine.okhttp.*
import org.koin.dsl.module

val platformModule = module {
    single { OkHttp.create() }
    single { TokenStorage(get()) }
    single { DatabaseDriverFactory(get()).create() }
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add Koin DI modules"
```

---

### Task 6: Theme + Shared UI Components

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/theme/Theme.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/theme/Type.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/LoadingState.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/ErrorState.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/LastUpdated.kt`

**Step 1: Create GrewMe theme**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/theme/Theme.kt
package com.grewme.parent.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF1565C0),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD1E4FF),
    secondary = Color(0xFF43A047),
    tertiary = Color(0xFFFFA726),
    background = Color(0xFFFAFAFA),
    surface = Color.White,
    error = Color(0xFFD32F2F),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF90CAF9),
    onPrimary = Color(0xFF003258),
    primaryContainer = Color(0xFF004A8F),
    secondary = Color(0xFF81C784),
    tertiary = Color(0xFFFFCC02),
    background = Color(0xFF121212),
    surface = Color(0xFF1E1E1E),
    error = Color(0xFFEF5350),
)

@Composable
fun GrewMeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = GrewMeTypography,
        content = content,
    )
}
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/theme/Type.kt
package com.grewme.parent.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val GrewMeTypography = Typography(
    headlineLarge = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.SemiBold),
    titleLarge = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Medium),
    bodyLarge = TextStyle(fontSize = 16.sp),
    bodyMedium = TextStyle(fontSize = 14.sp),
    bodySmall = TextStyle(fontSize = 12.sp),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium),
)
```

**Step 2: Create shared UI components**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/LoadingState.kt
package com.grewme.parent.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LoadingState(message: String = "Loading...", modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/ErrorState.kt
package com.grewme.parent.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ErrorState(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.error,
            )
            if (onRetry != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = onRetry) {
                    Text("Retry")
                }
            }
        }
    }
}
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/LastUpdated.kt
package com.grewme.parent.ui.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun LastUpdated(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier,
    )
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add GrewMe theme and shared UI components"
```

---

### Task 7: Radar Chart — Custom Compose Canvas

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/RadarChart.kt`

**Step 1: Create RadarChart composable**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/components/RadarChart.kt
package com.grewme.parent.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

data class RadarChartData(
    val labels: List<String>,
    val values: List<Float>, // 0f..100f
)

@OptIn(ExperimentalTextApi::class)
@Composable
fun RadarChart(
    data: RadarChartData,
    modifier: Modifier = Modifier,
    gridColor: Color = MaterialTheme.colorScheme.outlineVariant,
    fillColor: Color = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
    strokeColor: Color = MaterialTheme.colorScheme.primary,
    gridLevels: Int = 3,
) {
    val animatedValues = data.values.map { value ->
        animateFloatAsState(
            targetValue = value.coerceIn(0f, 100f) / 100f,
            animationSpec = tween(durationMillis = 600),
            label = "radar_value",
        )
    }

    val textMeasurer = rememberTextMeasurer()
    val labelStyle = TextStyle(
        fontSize = 12.sp,
        color = MaterialTheme.colorScheme.onSurface,
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .padding(32.dp)
    ) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val radius = size.minDimension / 2f
        val axisCount = data.labels.size
        val angleStep = 2 * PI.toFloat() / axisCount
        val startAngle = -PI.toFloat() / 2f // Start from top

        // Draw grid levels
        for (level in 1..gridLevels) {
            val levelRadius = radius * level / gridLevels
            val gridPath = Path()
            for (i in 0 until axisCount) {
                val angle = startAngle + i * angleStep
                val x = center.x + levelRadius * cos(angle)
                val y = center.y + levelRadius * sin(angle)
                if (i == 0) gridPath.moveTo(x, y) else gridPath.lineTo(x, y)
            }
            gridPath.close()
            drawPath(gridPath, gridColor, style = Stroke(width = 1.dp.toPx()))
        }

        // Draw axis lines
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val endX = center.x + radius * cos(angle)
            val endY = center.y + radius * sin(angle)
            drawLine(gridColor, center, Offset(endX, endY), strokeWidth = 1.dp.toPx())
        }

        // Draw data polygon
        val dataPath = Path()
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val value = animatedValues[i].value
            val x = center.x + radius * value * cos(angle)
            val y = center.y + radius * value * sin(angle)
            if (i == 0) dataPath.moveTo(x, y) else dataPath.lineTo(x, y)
        }
        dataPath.close()
        drawPath(dataPath, fillColor)
        drawPath(dataPath, strokeColor, style = Stroke(width = 2.dp.toPx()))

        // Draw data points
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val value = animatedValues[i].value
            val x = center.x + radius * value * cos(angle)
            val y = center.y + radius * value * sin(angle)
            drawCircle(strokeColor, radius = 4.dp.toPx(), center = Offset(x, y))
        }

        // Draw labels
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val labelRadius = radius + 20.dp.toPx()
            val x = center.x + labelRadius * cos(angle)
            val y = center.y + labelRadius * sin(angle)

            val textLayout = textMeasurer.measure(data.labels[i], labelStyle)
            val textX = x - textLayout.size.width / 2f
            val textY = y - textLayout.size.height / 2f

            drawText(textLayout, topLeft = Offset(textX, textY))
        }
    }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add custom Compose Canvas radar chart"
```

---

### Task 8: Screens, ViewModels, Navigation, App Entry Point

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/navigation/Routes.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/navigation/AuthState.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/auth/LoginScreen.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/auth/LoginViewModel.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/children/ChildrenScreen.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/children/ChildrenViewModel.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildDetailScreen.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildRadarViewModel.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildProgressViewModel.kt`
- Create: `composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildHistoryViewModel.kt`
- Modify: `composeApp/src/commonMain/kotlin/com/grewme/parent/App.kt`
- Modify: `composeApp/src/iosMain/kotlin/com/grewme/parent/MainViewController.kt`

This is the largest task. The implementer should create all files and wire everything together.

**Step 1: Create navigation routes**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/navigation/Routes.kt
package com.grewme.parent.navigation

import kotlinx.serialization.Serializable

@Serializable object LoginRoute
@Serializable object ChildrenRoute
@Serializable data class ChildDetailRoute(val childId: Long, val childName: String)
```

**Step 2: Create AuthState**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/navigation/AuthState.kt
package com.grewme.parent.navigation

sealed interface AuthState {
    data object Loading : AuthState
    data object Authenticated : AuthState
    data object Unauthenticated : AuthState
}
```

**Step 3: Create LoginViewModel**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/auth/LoginViewModel.kt
package com.grewme.parent.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.api.GrewMeApi
import com.grewme.parent.data.local.token.TokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

class LoginViewModel(
    private val api: GrewMeApi,
    private val tokenStorage: TokenStorage,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.value = _uiState.value.copy(email = email, error = null)
    }

    fun onPasswordChanged(password: String) {
        _uiState.value = _uiState.value.copy(password = password, error = null)
    }

    fun login() {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.value = state.copy(error = "Email and password are required")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isLoading = true, error = null)
            try {
                val response = api.login(state.email, state.password)
                tokenStorage.saveTokens(response.accessToken, response.refreshToken)
                _uiState.value = _uiState.value.copy(isLoading = false, isLoggedIn = true)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Login failed",
                )
            }
        }
    }
}
```

**Step 4: Create LoginScreen**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/auth/LoginScreen.kt
package com.grewme.parent.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import org.koin.compose.viewmodel.koinViewModel

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = koinViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) onLoginSuccess()
    }

    Surface(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "GrewMe",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = "Parent",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(48.dp))

            OutlinedTextField(
                value = uiState.email,
                onValueChange = viewModel::onEmailChanged,
                label = { Text("Email") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading,
            )
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = uiState.password,
                onValueChange = viewModel::onPasswordChanged,
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading,
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (uiState.error != null) {
                Text(
                    text = uiState.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = viewModel::login,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = !uiState.isLoading,
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text("Sign In")
                }
            }
        }
    }
}
```

**Step 5: Create ChildrenViewModel**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/children/ChildrenViewModel.kt
package com.grewme.parent.ui.children

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.ChildRepository
import com.grewme.parent.domain.model.Child
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface ChildrenUiState {
    data object Loading : ChildrenUiState
    data class Success(val children: List<Child>, val isRefreshing: Boolean = false) : ChildrenUiState
    data class Error(val message: String) : ChildrenUiState
}

class ChildrenViewModel(
    private val repository: ChildRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ChildrenUiState>(ChildrenUiState.Loading)
    val uiState: StateFlow<ChildrenUiState> = _uiState.asStateFlow()

    init {
        observeChildren()
        refresh()
    }

    private fun observeChildren() {
        viewModelScope.launch {
            repository.getChildren().collect { children ->
                if (children.isNotEmpty() || _uiState.value !is ChildrenUiState.Loading) {
                    _uiState.value = ChildrenUiState.Success(children)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val current = _uiState.value
            if (current is ChildrenUiState.Success) {
                _uiState.value = current.copy(isRefreshing = true)
            }
            try {
                repository.refresh()
            } catch (e: Exception) {
                if (_uiState.value is ChildrenUiState.Loading) {
                    _uiState.value = ChildrenUiState.Error(e.message ?: "Failed to load children")
                }
                // If we have cached data, keep showing it
            } finally {
                val updated = _uiState.value
                if (updated is ChildrenUiState.Success) {
                    _uiState.value = updated.copy(isRefreshing = false)
                }
            }
        }
    }
}
```

**Step 6: Create ChildrenScreen**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/children/ChildrenScreen.kt
package com.grewme.parent.ui.children

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.grewme.parent.domain.model.Child
import com.grewme.parent.ui.components.ErrorState
import com.grewme.parent.ui.components.LoadingState
import org.koin.compose.viewmodel.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChildrenScreen(
    onChildClick: (Child) -> Unit,
    onLogout: () -> Unit,
    viewModel: ChildrenViewModel = koinViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Children") },
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                },
            )
        },
    ) { padding ->
        when (val state = uiState) {
            ChildrenUiState.Loading -> LoadingState(modifier = Modifier.padding(padding))
            is ChildrenUiState.Error -> ErrorState(
                message = state.message,
                onRetry = viewModel::refresh,
                modifier = Modifier.padding(padding),
            )
            is ChildrenUiState.Success -> {
                if (state.children.isEmpty()) {
                    ErrorState(
                        message = "No children linked to your account",
                        modifier = Modifier.padding(padding),
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.padding(padding),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(state.children, key = { it.id }) { child ->
                            ChildCard(child = child, onClick = { onChildClick(child) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChildCard(child: Child, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = child.name,
                    style = MaterialTheme.typography.titleMedium,
                )
            }
        }
    }
}
```

**Step 7: Create Child Detail ViewModels**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildRadarViewModel.kt
package com.grewme.parent.ui.child

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.RadarRepository
import com.grewme.parent.domain.model.RadarData
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface RadarUiState {
    data object Loading : RadarUiState
    data class Success(val data: RadarData) : RadarUiState
    data class Error(val message: String) : RadarUiState
}

class ChildRadarViewModel(
    private val studentId: Long,
    private val repository: RadarRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<RadarUiState>(RadarUiState.Loading)
    val uiState: StateFlow<RadarUiState> = _uiState.asStateFlow()

    init {
        observe()
        refresh()
    }

    private fun observe() {
        viewModelScope.launch {
            repository.getRadarData(studentId).collect { data ->
                if (data != null) {
                    _uiState.value = RadarUiState.Success(data)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refresh(studentId)
            } catch (e: Exception) {
                if (_uiState.value is RadarUiState.Loading) {
                    _uiState.value = RadarUiState.Error(e.message ?: "Failed to load radar data")
                }
            }
        }
    }
}
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildProgressViewModel.kt
package com.grewme.parent.ui.child

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.ProgressRepository
import com.grewme.parent.domain.model.ProgressEntry
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface ProgressUiState {
    data object Loading : ProgressUiState
    data class Success(val entries: List<ProgressEntry>) : ProgressUiState
    data class Error(val message: String) : ProgressUiState
}

class ChildProgressViewModel(
    private val studentId: Long,
    private val repository: ProgressRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProgressUiState>(ProgressUiState.Loading)
    val uiState: StateFlow<ProgressUiState> = _uiState.asStateFlow()

    init {
        observe()
        refresh()
    }

    private fun observe() {
        viewModelScope.launch {
            repository.getProgress(studentId).collect { entries ->
                if (entries.isNotEmpty() || _uiState.value !is ProgressUiState.Loading) {
                    _uiState.value = ProgressUiState.Success(entries)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refresh(studentId)
            } catch (e: Exception) {
                if (_uiState.value is ProgressUiState.Loading) {
                    _uiState.value = ProgressUiState.Error(e.message ?: "Failed to load progress")
                }
            }
        }
    }
}
```

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildHistoryViewModel.kt
package com.grewme.parent.ui.child

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.DailyScoreRepository
import com.grewme.parent.domain.model.DailyScore
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface HistoryUiState {
    data object Loading : HistoryUiState
    data class Success(val scores: List<DailyScore>) : HistoryUiState
    data class Error(val message: String) : HistoryUiState
}

class ChildHistoryViewModel(
    private val studentId: Long,
    private val repository: DailyScoreRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        observe()
        refresh()
    }

    private fun observe() {
        viewModelScope.launch {
            repository.getScores(studentId).collect { scores ->
                if (scores.isNotEmpty() || _uiState.value !is HistoryUiState.Loading) {
                    _uiState.value = HistoryUiState.Success(scores)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refresh(studentId)
            } catch (e: Exception) {
                if (_uiState.value is HistoryUiState.Loading) {
                    _uiState.value = HistoryUiState.Error(e.message ?: "Failed to load scores")
                }
            }
        }
    }
}
```

**Step 8: Create ChildDetailScreen with tabs**

```kotlin
// composeApp/src/commonMain/kotlin/com/grewme/parent/ui/child/ChildDetailScreen.kt
package com.grewme.parent.ui.child

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.grewme.parent.domain.model.DailyScore
import com.grewme.parent.domain.model.ProgressEntry
import com.grewme.parent.domain.model.RadarData
import com.grewme.parent.ui.components.ErrorState
import com.grewme.parent.ui.components.LoadingState
import com.grewme.parent.ui.components.RadarChart
import com.grewme.parent.ui.components.RadarChartData
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChildDetailScreen(
    childId: Long,
    childName: String,
    onBack: () -> Unit,
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Radar", "Progress", "History")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(childName) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(selectedTabIndex = selectedTab) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title) },
                    )
                }
            }

            when (selectedTab) {
                0 -> RadarTab(childId)
                1 -> ProgressTab(childId)
                2 -> HistoryTab(childId)
            }
        }
    }
}

@Composable
private fun RadarTab(childId: Long) {
    val viewModel: ChildRadarViewModel = koinViewModel { parametersOf(childId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        RadarUiState.Loading -> LoadingState()
        is RadarUiState.Error -> ErrorState(state.message, onRetry = viewModel::refresh)
        is RadarUiState.Success -> {
            Column(modifier = Modifier.padding(16.dp)) {
                RadarChart(
                    data = state.data.toChartData(),
                    modifier = Modifier.fillMaxWidth(),
                )
                if (state.data.totalDaysScored != null) {
                    Text(
                        text = "Based on ${state.data.totalDaysScored} days of scores",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun ProgressTab(childId: Long) {
    val viewModel: ChildProgressViewModel = koinViewModel { parametersOf(childId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        ProgressUiState.Loading -> LoadingState()
        is ProgressUiState.Error -> ErrorState(state.message, onRetry = viewModel::refresh)
        is ProgressUiState.Success -> {
            if (state.entries.isEmpty()) {
                ErrorState(message = "No progress data yet")
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(state.entries) { entry ->
                        ProgressCard(entry)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProgressCard(entry: ProgressEntry) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = entry.period, style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            SkillRow("Reading", entry.reading)
            SkillRow("Math", entry.math)
            SkillRow("Writing", entry.writing)
            SkillRow("Logic", entry.logic)
            SkillRow("Social", entry.social)
        }
    }
}

@Composable
private fun SkillRow(label: String, value: Double) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
        Text(
            text = if (value > 0) "%.1f".format(value) else "-",
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun HistoryTab(childId: Long) {
    val viewModel: ChildHistoryViewModel = koinViewModel { parametersOf(childId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        HistoryUiState.Loading -> LoadingState()
        is HistoryUiState.Error -> ErrorState(state.message, onRetry = viewModel::refresh)
        is HistoryUiState.Success -> {
            if (state.scores.isEmpty()) {
                ErrorState(message = "No scores recorded yet")
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    items(state.scores, key = { it.id }) { score ->
                        ScoreRow(score)
                    }
                }
            }
        }
    }
}

@Composable
private fun ScoreRow(score: DailyScore) {
    ListItem(
        headlineContent = {
            Text("${score.skillCategory.replaceFirstChar { it.uppercase() }}: ${score.score}")
        },
        supportingContent = {
            Text(score.date)
        },
        trailingContent = score.notes?.let {
            { Text(it, style = MaterialTheme.typography.bodySmall) }
        },
    )
}

private fun RadarData.toChartData() = RadarChartData(
    labels = listOf("Reading", "Math", "Writing", "Logic", "Social"),
    values = listOf(
        reading.toFloat(),
        math.toFloat(),
        writing.toFloat(),
        logic.toFloat(),
        social.toFloat(),
    ),
)
```

**Step 9: Update App.kt — wire navigation**

Replace `composeApp/src/commonMain/kotlin/com/grewme/parent/App.kt`:

```kotlin
package com.grewme.parent

import androidx.compose.runtime.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.grewme.parent.data.local.token.TokenStorage
import com.grewme.parent.navigation.*
import com.grewme.parent.ui.auth.LoginScreen
import com.grewme.parent.ui.child.ChildDetailScreen
import com.grewme.parent.ui.children.ChildrenScreen
import com.grewme.parent.ui.theme.GrewMeTheme
import org.koin.compose.koinInject

@Composable
fun App() {
    GrewMeTheme {
        val navController = rememberNavController()
        val tokenStorage: TokenStorage = koinInject()

        val startDestination: Any = if (tokenStorage.getAccessToken() != null) {
            ChildrenRoute
        } else {
            LoginRoute
        }

        NavHost(navController = navController, startDestination = startDestination) {
            composable<LoginRoute> {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(ChildrenRoute) {
                            popUpTo<LoginRoute> { inclusive = true }
                        }
                    },
                )
            }

            composable<ChildrenRoute> {
                ChildrenScreen(
                    onChildClick = { child ->
                        navController.navigate(ChildDetailRoute(child.id, child.name))
                    },
                    onLogout = {
                        tokenStorage.clearTokens()
                        navController.navigate(LoginRoute) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                )
            }

            composable<ChildDetailRoute> { backStackEntry ->
                val route = backStackEntry.toRoute<ChildDetailRoute>()
                ChildDetailScreen(
                    childId = route.childId,
                    childName = route.childName,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
```

**Step 10: Update MainViewController.kt for Koin**

Replace `composeApp/src/iosMain/kotlin/com/grewme/parent/MainViewController.kt`:

```kotlin
package com.grewme.parent

import androidx.compose.ui.window.ComposeUIViewController
import com.grewme.parent.di.appModule
import com.grewme.parent.di.platformModule
import org.koin.core.context.startKoin

fun MainViewController() = ComposeUIViewController {
    App()
}

fun initKoin() {
    startKoin {
        modules(platformModule, appModule)
    }
}
```

Update `iosApp/iosApp/iOSApp.swift` to call `initKoin()`:

```swift
import SwiftUI
import ComposeApp

@main
struct iOSApp: App {
    init() {
        MainViewControllerKt.doInitKoin()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

**Step 11: Verify iOS build compiles**

Run:
```bash
cd /Users/theresiaputri/repo/grewme/mobile-app-parent && ./gradlew composeApp:compileKotlinIosSimulatorArm64 --no-daemon 2>&1 | tail -20
```

**Step 12: Commit**

```bash
git add -A && git commit -m "feat(parent-app): add screens, navigation, ViewModels, and app entry point"
```

---

### Task 9: Save to Outline

Save a summary of the parent app implementation to the GrewMe Outline collection (`d74aedb6-0aa1-4f5f-a8b4-b265e7517649`).

Title: `Feat: Parent Mobile App — iOS-First with Offline Support`
