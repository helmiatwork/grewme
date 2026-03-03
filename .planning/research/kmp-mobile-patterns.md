# KMP Mobile Patterns for GrewMe

**Domain:** Kotlin Multiplatform mobile app development (teacher + parent apps)
**Researched:** 2026-03-04
**Overall confidence:** HIGH

---

## 1. KMP Project Structure — Shared Module Between Apps

### Current Problem

Both `mobile-app-teacher` and `mobile-app-parent` are **completely separate Gradle projects** with identical `build.gradle.kts` files, identical `libs.versions.toml`, and no shared code. This means every feature (networking, models, auth, theming) will be written twice.

### Recommended Structure: Monorepo with Shared Module

**Confidence: HIGH** (verified via Context7/Koin docs, JetBrains official patterns, Google's KMP shared module template)

Consolidate into a single Gradle project with a shared KMP library module:

```
grewme-mobile/
├── build.gradle.kts                    # Root build
├── settings.gradle.kts                 # includes all modules
├── gradle/libs.versions.toml           # Single version catalog
│
├── shared/                             # KMP library module
│   └── src/
│       ├── commonMain/kotlin/com/grewme/shared/
│       │   ├── data/                   # API clients, repositories
│       │   │   ├── api/                # Ktor API service
│       │   │   ├── model/              # @Serializable DTOs
│       │   │   └── repository/         # Repository implementations
│       │   ├── domain/                 # Use cases, domain models
│       │   │   ├── model/              # Domain entities (Student, Skill, etc.)
│       │   │   └── usecase/            # Business logic
│       │   ├── auth/                   # Auth manager, token storage interface
│       │   ├── di/                     # Koin modules (common + expect platform)
│       │   └── ui/                     # Shared UI components
│       │       ├── theme/              # Material3 theme (colors, typography)
│       │       ├── component/          # Reusable composables (RadarChart, etc.)
│       │       └── chart/              # Radar chart implementation
│       ├── androidMain/kotlin/         # Android Ktor engine, Keystore storage
│       ├── iosMain/kotlin/             # iOS Darwin engine, Keychain storage
│       └── commonTest/kotlin/          # Shared tests
│
├── app-teacher/                        # Teacher Android/iOS app
│   └── composeApp/
│       └── src/
│           ├── commonMain/kotlin/com/grewme/teacher/
│           │   ├── navigation/         # Teacher-specific nav graph
│           │   ├── feature/            # Teacher-only screens
│           │   │   ├── dashboard/
│           │   │   ├── assessment/     # Score entry screens
│           │   │   ├── students/       # Student management
│           │   │   └── reports/
│           │   └── App.kt
│           ├── androidMain/
│           └── iosMain/
│
├── app-parent/                         # Parent Android/iOS app
│   └── composeApp/
│       └── src/
│           ├── commonMain/kotlin/com/grewme/parent/
│           │   ├── navigation/         # Parent-specific nav graph
│           │   ├── feature/            # Parent-only screens
│           │   │   ├── dashboard/
│           │   │   ├── progress/       # Child progress viewing
│           │   │   ├── children/       # Child list/switching
│           │   │   └── settings/
│           │   └── App.kt
│           ├── androidMain/
│           └── iosMain/
```

### settings.gradle.kts (root)

```kotlin
rootProject.name = "GrewMe"
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

pluginManagement {
    repositories {
        google { mavenContent { includeGroupAndSubgroups("androidx") } }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google { mavenContent { includeGroupAndSubgroups("androidx") } }
        mavenCentral()
    }
}

include(":shared")
include(":app-teacher:composeApp")
include(":app-parent:composeApp")
```

### shared/build.gradle.kts

```kotlin
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)     // Library, not Application
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinxSerialization)
}

kotlin {
    androidTarget { /* ... */ }
    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { /* ... */ }

    sourceSets {
        commonMain.dependencies {
            // ALL shared dependencies live here
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.ktor.client.auth)           // NEW: for bearer
            implementation(libs.koin.core)
            implementation(libs.koin.compose)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.androidx.lifecycle.viewmodel)
            implementation(libs.androidx.lifecycle.runtime.compose)
        }
        // App modules just add: implementation(projects.shared)
    }
}
```

### What Goes Where

| Layer | shared/ | app-teacher/ | app-parent/ |
|-------|---------|--------------|-------------|
| API client (Ktor) | Yes | - | - |
| DTOs (@Serializable) | Yes | - | - |
| Domain models | Yes | - | - |
| Repositories | Yes | - | - |
| Auth/token management | Yes | - | - |
| Material3 theme | Yes | - | - |
| Radar chart composable | Yes | - | - |
| Common UI components | Yes | - | - |
| Navigation graph | - | Yes | Yes |
| Feature screens | - | Yes | Yes |
| App entry point | - | Yes | Yes |

**Expected code sharing: ~70-80%.** The apps differ only in navigation structure and feature screens.

### Migration Path

The current two separate projects need to be consolidated. This is a one-time restructuring:

1. Create root `settings.gradle.kts` including all three modules
2. Convert current `composeApp` modules into `shared` (library) + two app modules
3. Move shared dependencies to `shared/build.gradle.kts`
4. App modules depend on `:shared` via `implementation(projects.shared)`

---

## 2. Ktor Client Patterns

**Confidence: HIGH** (verified via Context7 Ktor documentation)

### HTTP Client Setup with JWT Bearer Auth

Use Ktor's built-in `Auth` plugin with bearer token support. This handles:
- Auto-attaching tokens to requests
- Auto-refreshing on 401 responses
- Skipping auth for login/register endpoints

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/data/api/HttpClientFactory.kt

import io.ktor.client.*
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
    private val tokenStorage: TokenStorage,  // expect/actual interface
) {
    fun create(): HttpClient = HttpClient(engine) {

        // JSON serialization
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
                prettyPrint = false
            })
        }

        // Default request config
        defaultRequest {
            url {
                protocol = URLProtocol.HTTPS
                host = "api.grewme.com"    // configure per environment
                path("api/v1/")
            }
            contentType(ContentType.Application.Json)
        }

        // Bearer token authentication with auto-refresh
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
                        setBody(mapOf("refresh_token" to oldTokens?.refreshToken))
                    }
                    val tokens = response.body<TokenResponse>()
                    tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken)
                    BearerTokens(tokens.accessToken, tokens.refreshToken)
                }

                sendWithoutRequest { request ->
                    // Don't send auth for login/register endpoints
                    !request.url.encodedPath.contains("auth/login") &&
                    !request.url.encodedPath.contains("auth/register")
                }
            }
        }

        // Response validation — throw on non-2xx
        expectSuccess = true

        // Custom error handling
        HttpResponseValidator {
            handleResponseExceptionWithRequest { exception, _ ->
                when (exception) {
                    is ClientRequestException -> {
                        val status = exception.response.status
                        when (status) {
                            HttpStatusCode.Unauthorized -> throw AuthException("Session expired")
                            HttpStatusCode.Forbidden -> throw ForbiddenException("Access denied")
                            HttpStatusCode.NotFound -> throw NotFoundException("Resource not found")
                            else -> throw ApiException("Client error: ${status.value}")
                        }
                    }
                    is ServerResponseException -> {
                        throw ApiException("Server error: ${exception.response.status.value}")
                    }
                }
            }
        }

        // Timeouts
        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 15_000
            socketTimeoutMillis = 15_000
        }

        // Logging (development only)
        install(Logging) {
            level = LogLevel.HEADERS
        }
    }
}
```

### API Service Pattern

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/data/api/GrewMeApi.kt

class GrewMeApi(private val client: HttpClient) {

    // Students
    suspend fun getStudents(classroomId: Long): List<StudentDto> =
        client.get("classrooms/$classroomId/students").body()

    suspend fun getStudent(id: Long): StudentDto =
        client.get("students/$id").body()

    // Skills & Assessments
    suspend fun getSkillCategories(): List<SkillCategoryDto> =
        client.get("skill_categories").body()

    suspend fun submitAssessment(request: AssessmentRequest): AssessmentDto =
        client.post("assessments") { setBody(request) }.body()

    // Radar data
    suspend fun getStudentRadar(studentId: Long): RadarDataDto =
        client.get("students/$studentId/radar").body()

    // Auth
    suspend fun login(email: String, password: String): TokenResponse =
        client.post("auth/login") {
            setBody(LoginRequest(email, password))
        }.body()
}
```

### DTO Models with kotlinx.serialization

```kotlin
@Serializable
data class StudentDto(
    val id: Long,
    val name: String,
    @SerialName("classroom_id") val classroomId: Long,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class RadarDataDto(
    @SerialName("student_id") val studentId: Long,
    val axes: List<RadarAxisDto>,
)

@Serializable
data class RadarAxisDto(
    val label: String,
    val value: Double,          // 0.0..1.0 normalized
    @SerialName("max_value") val maxValue: Double,
)

@Serializable
data class TokenResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expires_in") val expiresIn: Long,
)

@Serializable
data class ApiError(
    val error: String,
    val message: String,
    val details: Map<String, List<String>>? = null,
)
```

### Custom Exception Hierarchy

```kotlin
sealed class AppException(message: String, cause: Throwable? = null) : Exception(message, cause)
class AuthException(message: String) : AppException(message)
class ForbiddenException(message: String) : AppException(message)
class NotFoundException(message: String) : AppException(message)
class ApiException(message: String) : AppException(message)
class NetworkException(message: String, cause: Throwable) : AppException(message, cause)
```

### Additional Ktor Dependencies Needed

Add to `libs.versions.toml`:
```toml
ktor-client-auth = { module = "io.ktor:ktor-client-auth", version.ref = "ktor" }
ktor-client-logging = { module = "io.ktor:ktor-client-logging", version.ref = "ktor" }
ktor-client-mock = { module = "io.ktor:ktor-client-mock", version.ref = "ktor" }  # for tests
```

---

## 3. Compose Multiplatform UI Architecture

**Confidence: HIGH** (verified via Context7, production GitHub examples from openMF/mobile-wallet, open-ani/animeko)

### Screen Architecture: ViewModel + UiState + UiEvent

The established KMP pattern uses `androidx.lifecycle.ViewModel` with `StateFlow<UiState>`:

```kotlin
// Pattern: sealed interface for state, data class for events

sealed interface StudentListUiState {
    data object Loading : StudentListUiState
    data class Success(
        val students: List<Student>,
        val searchQuery: String = "",
    ) : StudentListUiState
    data class Error(val message: String) : StudentListUiState
}

sealed interface StudentListEvent {
    data class ShowSnackbar(val message: String) : StudentListEvent
    data class NavigateToStudent(val studentId: Long) : StudentListEvent
}

class StudentListViewModel(
    private val getStudentsUseCase: GetStudentsUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow<StudentListUiState>(StudentListUiState.Loading)
    val uiState: StateFlow<StudentListUiState> = _uiState.asStateFlow()

    // One-shot events (navigation, snackbar)
    private val _events = Channel<StudentListEvent>(Channel.BUFFERED)
    val events: Flow<StudentListEvent> = _events.receiveAsFlow()

    init {
        loadStudents()
    }

    fun onSearchQueryChanged(query: String) {
        val currentState = _uiState.value
        if (currentState is StudentListUiState.Success) {
            _uiState.value = currentState.copy(searchQuery = query)
        }
    }

    fun onStudentClicked(studentId: Long) {
        viewModelScope.launch {
            _events.send(StudentListEvent.NavigateToStudent(studentId))
        }
    }

    private fun loadStudents() {
        viewModelScope.launch {
            _uiState.value = StudentListUiState.Loading
            try {
                val students = getStudentsUseCase()
                _uiState.value = StudentListUiState.Success(students = students)
            } catch (e: AppException) {
                _uiState.value = StudentListUiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
```

### Screen Composable Pattern

```kotlin
@Composable
fun StudentListScreen(
    viewModel: StudentListViewModel = koinViewModel(),
    onNavigateToStudent: (Long) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Handle one-shot events
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is StudentListEvent.NavigateToStudent ->
                    onNavigateToStudent(event.studentId)
                is StudentListEvent.ShowSnackbar -> { /* show snackbar */ }
            }
        }
    }

    // Render based on state
    when (val state = uiState) {
        StudentListUiState.Loading -> LoadingIndicator()
        is StudentListUiState.Error -> ErrorView(state.message)
        is StudentListUiState.Success -> StudentList(
            students = state.students,
            onStudentClicked = viewModel::onStudentClicked,
        )
    }
}
```

### Material3 Theming — Shared Theme Module

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/ui/theme/Theme.kt

private val GrewMeLightColorScheme = lightColorScheme(
    primary = Color(0xFF1565C0),         // Educational blue
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD1E4FF),
    secondary = Color(0xFF43A047),        // Growth green
    tertiary = Color(0xFFFFA726),         // Warm orange for highlights
    background = Color(0xFFFAFAFA),
    surface = Color.White,
    error = Color(0xFFD32F2F),
)

private val GrewMeDarkColorScheme = darkColorScheme(
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
    val colorScheme = if (darkTheme) GrewMeDarkColorScheme else GrewMeLightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = GrewMeTypography,
        shapes = GrewMeShapes,
        content = content,
    )
}
```

Both apps wrap their root composable with `GrewMeTheme { ... }` for consistent branding.

### Responsive Layouts

Use `BoxWithConstraints` for adaptive layouts:

```kotlin
@Composable
fun AdaptiveStudentDetail(student: Student, radarData: RadarData) {
    BoxWithConstraints {
        if (maxWidth > 600.dp) {
            // Tablet: side-by-side
            Row {
                StudentInfo(student, modifier = Modifier.weight(1f))
                RadarChart(radarData, modifier = Modifier.weight(1f))
            }
        } else {
            // Phone: stacked
            Column {
                RadarChart(radarData, modifier = Modifier.fillMaxWidth().aspectRatio(1f))
                StudentInfo(student)
            }
        }
    }
}
```

---

## 4. Navigation Compose in KMP

**Confidence: HIGH** (verified via official JetBrains documentation at kotlinlang.org/docs/multiplatform/compose-navigation.html)

### Type-Safe Navigation with Serializable Routes

Navigation Compose 2.8+ supports type-safe routes via `@Serializable` data classes/objects:

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/navigation/Routes.kt

import kotlinx.serialization.Serializable

// Use @Serializable objects/classes as route destinations

@Serializable object LoginRoute
@Serializable object DashboardRoute
@Serializable data class StudentDetailRoute(val studentId: Long)
@Serializable data class AssessmentRoute(val studentId: Long, val skillCategoryId: Long)
@Serializable data class RadarViewRoute(val studentId: Long)
@Serializable object SettingsRoute
```

### Teacher App Navigation Graph

```kotlin
// app-teacher/composeApp/src/commonMain/kotlin/.../navigation/TeacherNavGraph.kt

@Composable
fun TeacherNavGraph(
    navController: NavHostController = rememberNavController(),
    authState: AuthState,
) {
    val startDestination: Any = when (authState) {
        AuthState.Authenticated -> DashboardRoute
        AuthState.Unauthenticated -> LoginRoute
        AuthState.Loading -> return LoadingScreen()  // early return while checking
    }

    NavHost(navController = navController, startDestination = startDestination) {
        composable<LoginRoute> {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(DashboardRoute) {
                        popUpTo<LoginRoute> { inclusive = true }
                    }
                }
            )
        }

        composable<DashboardRoute> {
            TeacherDashboardScreen(
                onStudentClicked = { studentId ->
                    navController.navigate(StudentDetailRoute(studentId))
                }
            )
        }

        composable<StudentDetailRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<StudentDetailRoute>()
            StudentDetailScreen(
                studentId = route.studentId,
                onViewRadar = {
                    navController.navigate(RadarViewRoute(route.studentId))
                },
                onAssess = { categoryId ->
                    navController.navigate(AssessmentRoute(route.studentId, categoryId))
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable<RadarViewRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<RadarViewRoute>()
            RadarViewScreen(
                studentId = route.studentId,
                onBack = { navController.popBackStack() }
            )
        }

        composable<AssessmentRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<AssessmentRoute>()
            AssessmentScreen(
                studentId = route.studentId,
                skillCategoryId = route.skillCategoryId,
                onSubmitSuccess = { navController.popBackStack() },
                onBack = { navController.popBackStack() }
            )
        }
    }
}
```

### Auth State Handling Pattern

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/auth/AuthManager.kt

class AuthManager(
    private val tokenStorage: TokenStorage,
) {
    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        // Check stored tokens on startup
        viewModelScope.launch {
            val hasToken = tokenStorage.getAccessToken() != null
            _authState.value = if (hasToken) AuthState.Authenticated else AuthState.Unauthenticated
        }
    }

    suspend fun login(email: String, password: String) { /* ... */ }

    suspend fun logout() {
        tokenStorage.clearTokens()
        _authState.value = AuthState.Unauthenticated
    }
}

sealed interface AuthState {
    data object Loading : AuthState
    data object Authenticated : AuthState
    data object Unauthenticated : AuthState
}
```

### Root App Composable (per app)

```kotlin
@Composable
fun TeacherApp() {
    val authManager: AuthManager = koinInject()
    val authState by authManager.authState.collectAsStateWithLifecycle()

    GrewMeTheme {
        TeacherNavGraph(authState = authState)
    }
}
```

---

## 5. Koin DI — Module Organization for KMP

**Confidence: HIGH** (verified via Context7 Koin documentation, official KMP setup guides)

### Platform Module Pattern (expect/actual)

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/di/PlatformModule.kt
expect val platformModule: Module

// shared/src/androidMain/kotlin/com/grewme/shared/di/PlatformModule.android.kt
actual val platformModule = module {
    single<HttpClientEngine> { OkHttp.create() }
    single<TokenStorage> { AndroidTokenStorage(get()) }  // EncryptedSharedPreferences
}

// shared/src/iosMain/kotlin/com/grewme/shared/di/PlatformModule.ios.kt
actual val platformModule = module {
    single<HttpClientEngine> { Darwin.create() }
    single<TokenStorage> { IosTokenStorage() }  // Keychain
}
```

### Shared Module Organization

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/di/SharedModules.kt

val networkModule = module {
    single {
        HttpClientFactory(engine = get(), tokenStorage = get()).create()
    }
    single { GrewMeApi(client = get()) }
}

val repositoryModule = module {
    single<StudentRepository> { StudentRepositoryImpl(api = get()) }
    single<SkillRepository> { SkillRepositoryImpl(api = get()) }
    single<AssessmentRepository> { AssessmentRepositoryImpl(api = get()) }
    single<AuthRepository> { AuthRepositoryImpl(api = get(), tokenStorage = get()) }
}

val useCaseModule = module {
    factory { GetStudentsUseCase(studentRepo = get()) }
    factory { GetStudentRadarUseCase(studentRepo = get(), skillRepo = get()) }
    factory { SubmitAssessmentUseCase(assessmentRepo = get()) }
    factory { LoginUseCase(authRepo = get()) }
}

val authModule = module {
    single { AuthManager(tokenStorage = get()) }
}

// Collect all shared modules
val sharedModules = listOf(
    platformModule,
    networkModule,
    repositoryModule,
    useCaseModule,
    authModule,
)
```

### ViewModel Modules (per app)

```kotlin
// app-teacher/composeApp/src/commonMain/.../di/TeacherModule.kt
val teacherViewModelModule = module {
    viewModelOf(::TeacherDashboardViewModel)
    viewModelOf(::StudentListViewModel)
    viewModelOf(::AssessmentViewModel)
    viewModelOf(::StudentDetailViewModel)
    viewModelOf(::RadarViewModel)
}

// app-parent/composeApp/src/commonMain/.../di/ParentModule.kt
val parentViewModelModule = module {
    viewModelOf(::ParentDashboardViewModel)
    viewModelOf(::ChildProgressViewModel)
    viewModelOf(::ParentRadarViewModel)
}
```

### Koin Initialization

```kotlin
// In each app's root:
fun initKoin() {
    startKoin {
        modules(sharedModules + teacherViewModelModule)  // or parentViewModelModule
    }
}

// Android: call in Application.onCreate()
// iOS: call from Swift before creating the UI
```

### Using Koin in Composables

```kotlin
// Inject ViewModel
@Composable
fun StudentListScreen(
    viewModel: StudentListViewModel = koinViewModel(),  // from koin-compose
) { /* ... */ }

// Inject non-ViewModel dependencies
@Composable
fun SomeScreen() {
    val authManager: AuthManager = koinInject()
}
```

### Additional Koin Dependency

Add `koin-compose-viewmodel` for proper ViewModel integration:
```toml
koin-compose-viewmodel = { module = "io.insert-koin:koin-compose-viewmodel", version.ref = "koin" }
```

---

## 6. Secure Token Storage

**Confidence: HIGH** (verified via multiple sources, KSafe library, droidcon expect/actual article)

### Interface (commonMain)

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/auth/TokenStorage.kt

interface TokenStorage {
    suspend fun saveTokens(accessToken: String, refreshToken: String)
    suspend fun getAccessToken(): String?
    suspend fun getRefreshToken(): String?
    suspend fun clearTokens()
}
```

### Android Implementation — EncryptedSharedPreferences

```kotlin
// shared/src/androidMain/kotlin/.../auth/AndroidTokenStorage.kt

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class AndroidTokenStorage(context: Context) : TokenStorage {

    private val masterKey = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

    private val prefs = EncryptedSharedPreferences.create(
        "grewme_secure_prefs",
        masterKey,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override suspend fun saveTokens(accessToken: String, refreshToken: String) {
        prefs.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .apply()
    }

    override suspend fun getAccessToken(): String? =
        prefs.getString("access_token", null)

    override suspend fun getRefreshToken(): String? =
        prefs.getString("refresh_token", null)

    override suspend fun clearTokens() {
        prefs.edit().clear().apply()
    }
}
```

### iOS Implementation — Keychain

```kotlin
// shared/src/iosMain/kotlin/.../auth/IosTokenStorage.kt

import platform.Foundation.*
import platform.Security.*

class IosTokenStorage : TokenStorage {

    override suspend fun saveTokens(accessToken: String, refreshToken: String) {
        saveToKeychain("grewme_access_token", accessToken)
        saveToKeychain("grewme_refresh_token", refreshToken)
    }

    override suspend fun getAccessToken(): String? =
        readFromKeychain("grewme_access_token")

    override suspend fun getRefreshToken(): String? =
        readFromKeychain("grewme_refresh_token")

    override suspend fun clearTokens() {
        deleteFromKeychain("grewme_access_token")
        deleteFromKeychain("grewme_refresh_token")
    }

    private fun saveToKeychain(key: String, value: String) {
        deleteFromKeychain(key) // Remove old value first

        val data = (value as NSString).dataUsingEncoding(NSUTF8StringEncoding) ?: return
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrAccount to key,
            kSecAttrService to "com.grewme",
            kSecValueData to data,
            kSecAttrAccessible to kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ).toMap() as CFDictionaryRef

        SecItemAdd(query, null)
    }

    private fun readFromKeychain(key: String): String? {
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrAccount to key,
            kSecAttrService to "com.grewme",
            kSecReturnData to kCFBooleanTrue,
            kSecMatchLimit to kSecMatchLimitOne,
        ).toMap() as CFDictionaryRef

        val result = alloc<CFTypeRefVar>()
        val status = SecItemCopyMatching(query, result.ptr)

        if (status == errSecSuccess) {
            val data = result.value as? NSData ?: return null
            return NSString.create(data, NSUTF8StringEncoding) as? String
        }
        return null
    }

    private fun deleteFromKeychain(key: String) {
        val query = mapOf<Any?, Any?>(
            kSecClass to kSecClassGenericPassword,
            kSecAttrAccount to key,
            kSecAttrService to "com.grewme",
        ).toMap() as CFDictionaryRef

        SecItemDelete(query)
    }
}
```

### Alternative: Use KSafe Library

**KSafe** (github.com/ioannisa/KSafe, 207 stars, Apache 2.0) provides a production-ready, enterprise-grade encrypted key-value storage for KMP. It handles Android Keystore + iOS Keychain out of the box:

```kotlin
// If you prefer a library over hand-rolling:
// implementation("io.github.nicktgn:ksafe:1.6.0")
```

**Recommendation:** Start with hand-rolled `expect/actual` for token storage since it's a small surface area (4 methods). If you later need broader secure storage (user preferences, cached data), evaluate KSafe.

### Android Dependency

```toml
androidx-security-crypto = { module = "androidx.security:security-crypto", version = "1.1.0-alpha06" }
```

---

## 7. Custom Radar Chart with Compose Canvas

**Confidence: HIGH** (verified via GitHub examples: hi-manshu/charty, TheChance101/AAY-chart, Netguru custom charts article)

### Architecture Overview

A 5-axis radar (spider) chart for GrewMe's MLBB-style skill visualization:

1. **Grid** — concentric polygons (5 levels) showing scale
2. **Axis lines** — lines from center to each vertex
3. **Labels** — skill category names at each axis tip
4. **Data polygon** — filled/stroked polygon connecting the student's scores
5. **Data points** — dots at each score position
6. **Animation** — smooth transition when data loads/changes

### Implementation

```kotlin
// shared/src/commonMain/kotlin/com/grewme/shared/ui/chart/RadarChart.kt

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.text.*
import androidx.compose.ui.unit.dp
import kotlin.math.*

data class RadarAxis(
    val label: String,
    val value: Float,    // 0f..1f normalized
)

data class RadarChartConfig(
    val gridLevels: Int = 5,
    val fillAlpha: Float = 0.25f,
    val strokeWidth: Float = 3f,
    val gridStrokeWidth: Float = 1f,
    val pointRadius: Float = 6f,
    val labelPadding: Float = 24f,
    val animationDurationMs: Int = 800,
)

@OptIn(ExperimentalTextApi::class)
@Composable
fun RadarChart(
    axes: List<RadarAxis>,
    modifier: Modifier = Modifier,
    config: RadarChartConfig = RadarChartConfig(),
    dataColor: Color = MaterialTheme.colorScheme.primary,
    gridColor: Color = MaterialTheme.colorScheme.outlineVariant,
) {
    require(axes.size >= 3) { "Radar chart needs at least 3 axes" }

    // Animate values from 0 to actual
    val animationProgress = remember { Animatable(0f) }
    LaunchedEffect(axes) {
        animationProgress.snapTo(0f)
        animationProgress.animateTo(
            targetValue = 1f,
            animationSpec = tween(
                durationMillis = config.animationDurationMs,
                easing = FastOutSlowInEasing,
            )
        )
    }

    val textMeasurer = rememberTextMeasurer()
    val labelStyle = MaterialTheme.typography.labelSmall

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .padding(config.labelPadding.dp)
    ) {
        val centerX = size.width / 2f
        val centerY = size.height / 2f
        val maxRadius = minOf(centerX, centerY) * 0.75f // Leave room for labels
        val center = Offset(centerX, centerY)
        val numberOfAxes = axes.size
        val angleStep = (2 * PI / numberOfAxes).toFloat()
        val startAngle = -PI.toFloat() / 2f  // Start from top

        // 1. Draw grid polygons
        for (level in 1..config.gridLevels) {
            val levelRadius = maxRadius * level / config.gridLevels
            val gridPath = Path().apply {
                for (i in 0 until numberOfAxes) {
                    val angle = startAngle + i * angleStep
                    val x = centerX + levelRadius * cos(angle)
                    val y = centerY + levelRadius * sin(angle)
                    if (i == 0) moveTo(x, y) else lineTo(x, y)
                }
                close()
            }
            drawPath(
                path = gridPath,
                color = gridColor,
                style = Stroke(width = config.gridStrokeWidth),
            )
        }

        // 2. Draw axis lines
        for (i in 0 until numberOfAxes) {
            val angle = startAngle + i * angleStep
            val endX = centerX + maxRadius * cos(angle)
            val endY = centerY + maxRadius * sin(angle)
            drawLine(
                color = gridColor,
                start = center,
                end = Offset(endX, endY),
                strokeWidth = config.gridStrokeWidth,
            )
        }

        // 3. Draw data polygon (animated)
        val progress = animationProgress.value
        val dataPath = Path().apply {
            for (i in 0 until numberOfAxes) {
                val angle = startAngle + i * angleStep
                val radius = maxRadius * axes[i].value * progress
                val x = centerX + radius * cos(angle)
                val y = centerY + radius * sin(angle)
                if (i == 0) moveTo(x, y) else lineTo(x, y)
            }
            close()
        }

        // Fill
        drawPath(
            path = dataPath,
            color = dataColor.copy(alpha = config.fillAlpha),
            style = Fill,
        )
        // Stroke
        drawPath(
            path = dataPath,
            color = dataColor,
            style = Stroke(width = config.strokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )

        // 4. Draw data points
        for (i in 0 until numberOfAxes) {
            val angle = startAngle + i * angleStep
            val radius = maxRadius * axes[i].value * progress
            val x = centerX + radius * cos(angle)
            val y = centerY + radius * sin(angle)
            drawCircle(
                color = dataColor,
                radius = config.pointRadius,
                center = Offset(x, y),
            )
            // White inner dot
            drawCircle(
                color = Color.White,
                radius = config.pointRadius * 0.5f,
                center = Offset(x, y),
            )
        }

        // 5. Draw axis labels
        for (i in 0 until numberOfAxes) {
            val angle = startAngle + i * angleStep
            val labelRadius = maxRadius + config.labelPadding
            val labelX = centerX + labelRadius * cos(angle)
            val labelY = centerY + labelRadius * sin(angle)

            val textLayout = textMeasurer.measure(
                text = AnnotatedString(axes[i].label),
                style = labelStyle,
            )
            val textWidth = textLayout.size.width
            val textHeight = textLayout.size.height

            // Center label around its anchor point
            val offsetX = labelX - textWidth / 2f
            val offsetY = labelY - textHeight / 2f

            drawText(
                textLayoutResult = textLayout,
                topLeft = Offset(offsetX, offsetY),
            )
        }
    }
}
```

### Usage in a Screen

```kotlin
@Composable
fun RadarViewScreen(studentId: Long, onBack: () -> Unit) {
    val viewModel: RadarViewModel = koinViewModel()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(studentId) { viewModel.loadRadar(studentId) }

    when (val state = uiState) {
        is RadarUiState.Success -> {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(state.studentName, style = MaterialTheme.typography.headlineMedium)
                RadarChart(
                    axes = state.axes.map { RadarAxis(it.label, it.normalizedValue) },
                    modifier = Modifier.fillMaxWidth().aspectRatio(1f),
                )
            }
        }
        RadarUiState.Loading -> CircularProgressIndicator()
        is RadarUiState.Error -> ErrorView(state.message)
    }
}
```

### MLBB-Style Enhancements (Phase 2)

For the signature MLBB look:
- **Gradient fill** instead of solid: use `Brush.radialGradient` in `drawPath`
- **Glow effect**: draw the data polygon twice — once with thicker stroke + alpha for glow
- **Score labels**: show numeric value at each data point
- **Comparison overlay**: draw two data polygons (previous vs current) with different colors

### Touch Interaction (Phase 3)

```kotlin
Canvas(
    modifier = modifier
        .pointerInput(Unit) {
            detectTapGestures { offset ->
                // Check if tap is near any data point
                for (i in 0 until numberOfAxes) {
                    val pointOffset = calculatePointOffset(i, axes[i].value, /* ... */)
                    if ((offset - pointOffset).getDistance() < touchTargetRadius) {
                        onAxisTapped(i, axes[i])
                        break
                    }
                }
            }
        }
) { /* drawing code */ }
```

### Alternative: Use a Library

- **Charty** (github.com/hi-manshu/charty) — has `RadarChart` composable for CMP, production-ready
- **AAY-Chart** (github.com/TheChance101/AAY-chart, MIT license) — CMP radar chart

**Recommendation:** Build custom. GrewMe's radar IS the product — the MLBB-style visual is a core differentiator. Using a library means fighting it for customization. The implementation above is ~150 lines and fully controllable.

---

## 8. Offline Support

**Confidence: MEDIUM** (Room KMP is available but relatively new; pattern is well-established)

### Strategy: Cache-First with Network Refresh

For GrewMe, offline support matters for:
- **Reading student lists/radar data** — teacher in classroom with poor connectivity
- **Submitting assessments** — queue locally, sync when online

### Database: Room KMP

Room gained KMP support (v2.7.0+). Since the team likely knows Room from Android, it's the best choice over SQLDelight:

```toml
# libs.versions.toml
room = "2.8.4"
sqlite = "2.6.2"
ksp = "2.1.0-1.0.29"

[libraries]
androidx-room-runtime = { module = "androidx.room:room-runtime", version.ref = "room" }
androidx-room-compiler = { module = "androidx.room:room-compiler", version.ref = "room" }
androidx-sqlite-bundled = { module = "androidx.sqlite:sqlite-bundled", version.ref = "sqlite" }

[plugins]
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
room = { id = "androidx.room", version.ref = "room" }
```

### Room Entity + DAO (commonMain)

```kotlin
@Entity(tableName = "students")
data class StudentEntity(
    @PrimaryKey val id: Long,
    val name: String,
    val classroomId: Long,
    val lastSyncedAt: Long,  // epoch millis
)

@Entity(tableName = "radar_data")
data class RadarDataEntity(
    @PrimaryKey val studentId: Long,
    val axesJson: String,    // serialized JSON
    val lastSyncedAt: Long,
)

@Entity(tableName = "pending_assessments")
data class PendingAssessmentEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val studentId: Long,
    val skillCategoryId: Long,
    val score: Int,
    val notes: String?,
    val createdAt: Long,
    val synced: Boolean = false,
)

@Dao
interface StudentDao {
    @Query("SELECT * FROM students WHERE classroomId = :classroomId")
    fun getStudentsByClassroom(classroomId: Long): Flow<List<StudentEntity>>

    @Upsert
    suspend fun upsertStudents(students: List<StudentEntity>)
}

@Dao
interface PendingAssessmentDao {
    @Insert
    suspend fun insert(assessment: PendingAssessmentEntity)

    @Query("SELECT * FROM pending_assessments WHERE synced = 0")
    suspend fun getUnsynced(): List<PendingAssessmentEntity>

    @Query("UPDATE pending_assessments SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: Long)
}
```

### Repository Pattern: Cache-First

```kotlin
class StudentRepositoryImpl(
    private val api: GrewMeApi,
    private val studentDao: StudentDao,
) : StudentRepository {

    override fun getStudents(classroomId: Long): Flow<List<Student>> =
        studentDao.getStudentsByClassroom(classroomId)
            .map { entities -> entities.map { it.toDomain() } }
            .onStart {
                // Trigger background refresh
                try {
                    val remote = api.getStudents(classroomId)
                    studentDao.upsertStudents(remote.map { it.toEntity() })
                } catch (e: Exception) {
                    // Network failure is OK — we serve from cache
                    // But emit error if cache is empty
                }
            }
}
```

### Optimistic Assessment Submission

```kotlin
class AssessmentRepositoryImpl(
    private val api: GrewMeApi,
    private val pendingDao: PendingAssessmentDao,
) : AssessmentRepository {

    override suspend fun submitAssessment(request: AssessmentRequest): Result<Assessment> {
        // Save locally immediately (optimistic)
        val pending = PendingAssessmentEntity(
            studentId = request.studentId,
            skillCategoryId = request.skillCategoryId,
            score = request.score,
            notes = request.notes,
            createdAt = Clock.System.now().toEpochMilliseconds(),
        )
        pendingDao.insert(pending)

        // Try to sync now
        return try {
            val result = api.submitAssessment(request)
            pendingDao.markSynced(pending.id)
            Result.success(result.toDomain())
        } catch (e: Exception) {
            // Will be synced later by SyncWorker
            Result.success(pending.toDomain())  // Return local version
        }
    }

    // Called periodically or on network restore
    suspend fun syncPending() {
        val unsynced = pendingDao.getUnsynced()
        for (assessment in unsynced) {
            try {
                api.submitAssessment(assessment.toRequest())
                pendingDao.markSynced(assessment.id)
            } catch (e: Exception) {
                break  // Stop on first failure, retry later
            }
        }
    }
}
```

### Platform Database Builder

```kotlin
// expect in commonMain
expect class DatabaseBuilderFactory {
    fun create(): RoomDatabase.Builder<GrewMeDatabase>
}

// Android actual
actual class DatabaseBuilderFactory(private val context: Context) {
    actual fun create(): RoomDatabase.Builder<GrewMeDatabase> =
        Room.databaseBuilder(context, GrewMeDatabase::class.java, "grewme.db")
}

// iOS actual
actual class DatabaseBuilderFactory {
    actual fun create(): RoomDatabase.Builder<GrewMeDatabase> {
        val dbPath = NSHomeDirectory() + "/Documents/grewme.db"
        return Room.databaseBuilder(GrewMeDatabase::class.java, dbPath)
    }
}
```

---

## 9. Testing KMP

**Confidence: HIGH** (verified via Context7 Ktor MockEngine docs, production test examples from StreetComplete, touchlab/KaMPKit, multiple articles)

### Test Dependencies

```toml
# libs.versions.toml additions
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "kotlinx-coroutines" }
ktor-client-mock = { module = "io.ktor:ktor-client-mock", version.ref = "ktor" }
turbine = { module = "app.cash.turbine:turbine", version = "1.2.0" }
kotlin-test = { module = "org.jetbrains.kotlin:kotlin-test", version.ref = "kotlin" }
```

In `shared/build.gradle.kts`:
```kotlin
commonTest.dependencies {
    implementation(libs.kotlin.test)
    implementation(libs.kotlinx.coroutines.test)
    implementation(libs.ktor.client.mock)
    implementation(libs.turbine)
}
```

### Testing Ktor API Client with MockEngine

```kotlin
// shared/src/commonTest/kotlin/.../data/api/GrewMeApiTest.kt

class GrewMeApiTest {

    @Test
    fun `getStudents returns parsed student list`() = runTest {
        val mockEngine = MockEngine { _ ->
            respond(
                content = """
                    [
                        {"id": 1, "name": "Alice", "classroom_id": 10, "created_at": "2025-01-01"},
                        {"id": 2, "name": "Bob", "classroom_id": 10, "created_at": "2025-01-02"}
                    ]
                """.trimIndent(),
                status = HttpStatusCode.OK,
                headers = headersOf(HttpHeaders.ContentType, "application/json"),
            )
        }

        val client = HttpClient(mockEngine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
        val api = GrewMeApi(client)

        val students = api.getStudents(classroomId = 10)
        assertEquals(2, students.size)
        assertEquals("Alice", students[0].name)
    }

    @Test
    fun `getStudents throws on 500 error`() = runTest {
        val mockEngine = MockEngine { _ ->
            respond(
                content = """{"error": "Internal Server Error"}""",
                status = HttpStatusCode.InternalServerError,
                headers = headersOf(HttpHeaders.ContentType, "application/json"),
            )
        }

        val client = HttpClient(mockEngine) {
            install(ContentNegotiation) { json() }
            expectSuccess = true
        }
        val api = GrewMeApi(client)

        assertFailsWith<ServerResponseException> {
            api.getStudents(classroomId = 10)
        }
    }

    @Test
    fun `bearer token is refreshed on 401`() = runTest {
        var requestCount = 0
        val mockEngine = MockEngine { request ->
            requestCount++
            when {
                requestCount == 1 -> respond(
                    content = "",
                    status = HttpStatusCode.Unauthorized,
                )
                request.url.encodedPath.contains("auth/refresh") -> respond(
                    content = """{"access_token": "new_token", "refresh_token": "new_refresh", "expires_in": 3600}""",
                    status = HttpStatusCode.OK,
                    headers = headersOf(HttpHeaders.ContentType, "application/json"),
                )
                else -> respond(
                    content = """[{"id": 1, "name": "Alice", "classroom_id": 10, "created_at": "2025-01-01"}]""",
                    status = HttpStatusCode.OK,
                    headers = headersOf(HttpHeaders.ContentType, "application/json"),
                )
            }
        }
        // ... configure client with Auth plugin, verify token refresh flow
    }
}
```

### Testing ViewModels with Turbine

```kotlin
// shared/src/commonTest/kotlin/.../StudentListViewModelTest.kt

class StudentListViewModelTest {

    @Test
    fun `loading students emits Loading then Success`() = runTest {
        val fakeRepo = FakeStudentRepository(
            students = listOf(
                Student(id = 1, name = "Alice", classroomId = 10),
                Student(id = 2, name = "Bob", classroomId = 10),
            )
        )
        val viewModel = StudentListViewModel(
            getStudentsUseCase = GetStudentsUseCase(fakeRepo)
        )

        viewModel.uiState.test {
            // Initial state
            assertEquals(StudentListUiState.Loading, awaitItem())
            // After loading
            val success = awaitItem() as StudentListUiState.Success
            assertEquals(2, success.students.size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `error state on repository failure`() = runTest {
        val fakeRepo = FakeStudentRepository(
            error = ApiException("Network error")
        )
        val viewModel = StudentListViewModel(
            getStudentsUseCase = GetStudentsUseCase(fakeRepo)
        )

        viewModel.uiState.test {
            assertEquals(StudentListUiState.Loading, awaitItem())
            val error = awaitItem() as StudentListUiState.Error
            assertEquals("Network error", error.message)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

### Fake Repository Pattern (no mocking library needed)

```kotlin
// shared/src/commonTest/kotlin/.../FakeStudentRepository.kt

class FakeStudentRepository(
    private val students: List<Student> = emptyList(),
    private val error: Exception? = null,
) : StudentRepository {
    override suspend fun getStudents(classroomId: Long): List<Student> {
        if (error != null) throw error
        return students
    }
}
```

**Note on MockK:** MockK does not fully support KMP `commonTest` (it's JVM/Android only). Use **fake implementations** of interfaces in `commonTest`. This is actually better practice — fakes are explicit, self-documenting, and don't require reflection.

### Test Structure

```
shared/src/commonTest/kotlin/com/grewme/shared/
├── data/
│   ├── api/
│   │   └── GrewMeApiTest.kt           # Ktor MockEngine tests
│   └── repository/
│       └── StudentRepositoryTest.kt    # Repository with fakes
├── domain/
│   └── usecase/
│       └── GetStudentsUseCaseTest.kt   # Use case logic
├── fakes/                               # Shared test doubles
│   ├── FakeStudentRepository.kt
│   ├── FakeTokenStorage.kt
│   └── FakeGrewMeApi.kt
└── viewmodel/                           # ViewModel tests
    ├── StudentListViewModelTest.kt
    └── RadarViewModelTest.kt
```

### Running Tests

```bash
# Run all common tests (runs on JVM host)
./gradlew :shared:jvmTest

# Run on specific platform
./gradlew :shared:iosSimulatorArm64Test
./gradlew :shared:testDebugUnitTest  # Android
```

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project structure | Monorepo with shared module | Eliminate code duplication between teacher/parent apps |
| Networking | Ktor + built-in Auth plugin | Native bearer token management, auto-refresh on 401 |
| Serialization | kotlinx.serialization | First-class KMP support, compile-time safe |
| DI | Koin 4.0 with expect/actual platform modules | Already in project, excellent KMP support |
| Navigation | Navigation Compose 2.8+ with @Serializable routes | Type-safe, official JetBrains KMP support |
| Token storage | Custom expect/actual (Android EncryptedSharedPrefs / iOS Keychain) | Small surface area, no library dependency needed |
| Radar chart | Custom Compose Canvas | Core product differentiator, needs MLBB styling |
| Offline DB | Room KMP (2.8+) | Familiar to Android devs, official KMP support |
| Testing | kotlin-test + Ktor MockEngine + Turbine + Fakes | No mocking library needed for commonTest |

## Dependencies to Add

Current `libs.versions.toml` needs these additions:

```toml
# New versions
room = "2.8.4"
sqlite = "2.6.2"
ksp = "2.1.0-1.0.29"
turbine = "1.2.0"

# New libraries
ktor-client-auth = { module = "io.ktor:ktor-client-auth", version.ref = "ktor" }
ktor-client-logging = { module = "io.ktor:ktor-client-logging", version.ref = "ktor" }
ktor-client-mock = { module = "io.ktor:ktor-client-mock", version.ref = "ktor" }
koin-compose-viewmodel = { module = "io.insert-koin:koin-compose-viewmodel", version.ref = "koin" }
androidx-room-runtime = { module = "androidx.room:room-runtime", version.ref = "room" }
androidx-room-compiler = { module = "androidx.room:room-compiler", version.ref = "room" }
androidx-sqlite-bundled = { module = "androidx.sqlite:sqlite-bundled", version.ref = "sqlite" }
androidx-security-crypto = { module = "androidx.security:security-crypto", version = "1.1.0-alpha06" }
turbine = { module = "app.cash.turbine:turbine", version.ref = "turbine" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "kotlinx-coroutines" }
kotlin-test = { module = "org.jetbrains.kotlin:kotlin-test", version.ref = "kotlin" }

# New plugins
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
room = { id = "androidx.room", version.ref = "room" }
```

## Pitfalls to Watch

1. **iOS Keychain API is tricky** — The Kotlin/Native interop with Security framework requires careful `CFDictionary` handling. Test on real device early.

2. **Room KMP is newer** — Some Room features (multi-instance invalidation, pre-packaged DBs) are NOT available in KMP. Verify any Room feature you plan to use against the KMP compatibility list.

3. **Navigation Compose alpha** — Version 2.8.0-alpha10 is pre-release. Type-safe routes API may change. Pin the version and test thoroughly.

4. **ViewModel lifecycle on iOS** — `ViewModel.viewModelScope` works in KMP but iOS doesn't have the same lifecycle as Android's Activity/Fragment. Ensure the Compose lifecycle integration (`lifecycle-runtime-compose`) is properly wired.

5. **Koin ViewModel resolution** — Use `koinViewModel()` (from `koin-compose-viewmodel`), NOT `koinInject()` for ViewModels. The latter creates a new instance every recomposition.

6. **Ktor Auth plugin retry loop** — If refresh token is also expired, the Auth plugin can loop. Set `sendWithoutRequest` correctly and handle refresh failure by clearing tokens and redirecting to login.

7. **Canvas text rendering** — `rememberTextMeasurer()` + `drawText()` is the correct approach for text on Canvas in CMP. Do NOT use the older `drawContext.canvas.nativeCanvas` approach — it's not multiplatform.

8. **Monorepo migration** — Converting two separate Gradle projects into a monorepo is disruptive. Do it FIRST, before building any features. Both apps should compile and show their placeholder screens from the monorepo before adding shared code.

## Sources

- Context7: Ktor documentation (/ktorio/ktor-documentation) — Bearer auth, response validation, error handling
- Context7: Koin documentation (/websites/insert-koin_io) — KMP modules, expect/actual, ViewModel scoping
- Context7: Compose Multiplatform (/jetbrains/compose-multiplatform) — Canvas drawing, resources
- Context7: kotlinx.serialization (/kotlin/kotlinx.serialization)
- Official: kotlinlang.org/docs/multiplatform/compose-navigation.html — Navigation Compose in KMP
- Official: developer.android.com/kotlin/multiplatform/room — Room KMP setup
- GitHub: hi-manshu/charty — RadarChart implementation reference
- GitHub: TheChance101/AAY-chart — Radar chart CMP reference
- GitHub: ioannisa/KSafe — KMP secure storage library
- GitHub: openMF/mobile-wallet — Production KMP ViewModel patterns
- GitHub: touchlab/KaMPKit — Ktor MockEngine test patterns
- Article: kmpship.app/blog/kotlin-multiplatform-testing-guide-2025 — KMP testing guide
- Article: medium.com/@mohaberabi98 — Secure storage in KMP
- Article: netguru.com/blog/compose-multiplatform-custom-charts — Custom charts in CMP
