# mobile-app-parent/

## Responsibility
**DEPRECATED — being replaced by React Native (see `docs/superpowers/plans/2026-04-01-react-native-mobile-apps.md`).**

Kotlin Multiplatform (KMP) + Compose Multiplatform parent mobile app. Targets Android and iOS. Allows parents to view their children's learning progress, behavior reports, and weekly summaries.

## Design
- **Framework**: Kotlin Multiplatform Mobile (KMM) with Compose Multiplatform UI
- **Architecture**: Clean Architecture — `data/` (API + local DB), `domain/` (models, use cases), `ui/` (Compose screens)
- **DI**: Koin (commonMain `di/` module)
- **Auth**: JWT stored in platform-specific SecureStorage (Keychain/Keystore via `data/local/token/`)
- **Local DB**: SQLDelight for offline data (Android: Room-compatible, iOS: SQLite)
- **Structure**: `commonMain/` (shared code) + `androidMain/` (Android-specific) + `iosMain/` (iOS-specific)

## Key Screens (commonMain/ui/)
- `auth/` — Login screen
- `children/` — Children list
- `child/` — Individual child detail (behavior, scores)

## Integration
- **Backend**: Rails GraphQL API (via Ktor HTTP client + Apollo Kotlin)
- **Replaces**: Nothing (new feature, was deferred)
- **Replaced by**: `mobile/apps/parent/` (React Native + Expo, planned)
