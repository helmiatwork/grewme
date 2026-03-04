# Design: Parent Mobile App

## Problem

The parent mobile app is a placeholder ("Coming soon..."). Parents need to view their children's learning progress via radar charts, trends, and score history — with offline support.

## Key Decisions

- **Platform:** iOS-first (test on iOS simulator/device), Android configured but untested
- **Radar chart:** Custom Compose Canvas (5-axis, animated, MLBB-inspired)
- **Offline:** Cache-first reads via SQLDelight
- **Token storage:** iOS Keychain via expect/actual, Android EncryptedSharedPreferences
- **Code sharing:** Parent-only for now, extract shared module when building teacher app
- **DB:** SQLDelight (KMP-native, works on iOS + Android)

## Architecture

```
mobile-app-parent/composeApp/src/
├── commonMain/kotlin/com/grewme/parent/
│   ├── data/
│   │   ├── api/          # Ktor client, DTOs, auth interceptor
│   │   ├── local/
│   │   │   ├── db/       # SQLDelight driver, queries
│   │   │   └── token/    # expect TokenStorage
│   │   ├── repository/   # Cache-first repos
│   │   └── mapper/       # DTO <-> Entity <-> Domain
│   ├── domain/model/     # Child, RadarData, DailyScore, ProgressData
│   ├── di/               # Koin modules
│   ├── ui/
│   │   ├── theme/        # GrewMe Material3 theme
│   │   ├── components/   # RadarChart, LoadingState, ErrorState, LastUpdated
│   │   ├── auth/         # LoginScreen + LoginViewModel
│   │   ├── children/     # ChildrenListScreen + ViewModel
│   │   └── child/        # ChildDetailScreen (tabs) + ViewModels
│   ├── navigation/       # NavHost, routes, auth guard
│   └── App.kt
├── iosMain/              # actual: Keychain TokenStorage, SQLDelight iOS driver
└── androidMain/          # actual: EncryptedSharedPrefs, SQLDelight Android driver
```

**Pattern:** MVVM with Koin DI. ViewModels hold UI state via StateFlow, repositories abstract cache-first data access, Ktor handles networking, SQLDelight provides local persistence.

## Screens (6 total)

| Screen | Route | API Endpoint | Description |
|--------|-------|-------------|-------------|
| Login | /login | POST /auth/login | Email + password, stores JWT |
| Children List | /children | GET /parents/children | Dashboard showing linked children |
| Child Radar | /children/{id}/radar | GET /students/{id}/radar | 5-axis radar chart (current snapshot) |
| Child Progress | /children/{id}/progress | GET /students/{id}/progress | Weekly/monthly trend lines per skill |
| Child History | /children/{id}/history | GET /students/{id}/daily_scores | Chronological list of daily scores |

Child Detail is a tab container for Radar/Progress/History.

## Navigation Flow

```
Login -> Children List -> Child Detail (tabs: Radar | Progress | History)
              ^ back            ^ tab switching (no back stack)
```

## Auth Flow

1. App starts -> check for stored token -> if valid, go to Children List
2. If no token or expired -> show Login
3. On login success -> store access + refresh tokens -> navigate to Children List
4. On 401 -> Ktor Auth plugin auto-refreshes using refresh token
5. If refresh fails -> clear tokens -> back to Login

## Radar Chart Component

Custom Compose Canvas composable:
- 5 axes: Reading, Math, Writing, Logic, Social
- Pentagon grid (3 concentric levels: 33%, 66%, 100%)
- Filled polygon for scores with semi-transparent fill
- Axis labels positioned outside the chart
- Animated transitions when data changes (animateFloatAsState)

## Data Layer (SQLDelight + Cache-First)

SQLDelight tables (.sq files):
- children: id, name, classroom_name, cached_at
- radar_data: student_id, reading, math, writing, logic, social, cached_at
- daily_scores: id, student_id, date, skill_category, score, notes, cached_at
- progress_data: student_id, period, reading, math, writing, logic, social, cached_at

Repository pattern:
```kotlin
class ChildRepository(api, db) {
    fun getChildren(): Flow<List<Child>>  // SQLDelight Flow, instant
    suspend fun refresh()                  // Fetch API -> upsert SQLDelight
}
```

Offline indicator: "Last updated: X ago" badge when showing cached data.

## Requirements Covered

- PARENT-01: Dashboard screen (children list)
- PARENT-02: Child progress screen (radar chart)
- PARENT-03: Trend view (weekly/monthly progress)
- PARENT-04: Daily score history
- PARENT-05: Child switching (children list -> tap different child)
- PARENT-06: Navigation (Login -> Children -> Child Detail)
- RADAR-01: Custom Compose Canvas radar chart with 5 axes
- RADAR-02: Filled polygon on 5-point star grid
- RADAR-03: Animated transitions
- RADAR-04: Axis labels positioned correctly
- RADAR-05: Shared composable (in commonMain, usable by both apps later)
- KMP-02: Shared Ktor HttpClient with Auth plugin (partial — parent-only)
- KMP-03: Shared TokenStorage expect/actual (partial — parent-only)
- KMP-07: Auth state machine (Loading -> Authenticated/Unauthenticated)
- KMP-08: Login screen

## Not Included (YAGNI)

- No teacher app code sharing (extract later)
- No COPPA consent flow (Phase 3)
- No MLBB glow effects (v2)
- No real-time updates (v2)
- No Android testing (iOS-first)

## Date

2026-03-04
