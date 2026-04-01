# mobile-app-teacher/

## Responsibility
**DEPRECATED — being replaced by React Native (see `docs/superpowers/plans/2026-04-01-react-native-mobile-apps.md`).**

Kotlin Multiplatform (KMP) + Compose Multiplatform teacher mobile app. Targets Android and iOS. Allows teachers to record behavior points, view class overviews, and manage student assessments from mobile.

## Design
- **Framework**: Kotlin Multiplatform Mobile (KMM) with Compose Multiplatform UI
- **Architecture**: Clean Architecture — `data/` (API + local DB), `domain/` (models), `ui/` (Compose screens)
- **DI**: Koin
- **Auth**: JWT stored in platform-specific SecureStorage
- **Structure**: `commonMain/` (shared code) + `androidMain/` + `iosMain/`

## Integration
- **Backend**: Rails GraphQL API
- **Replaced by**: `mobile/apps/teacher/` (React Native + Expo, planned)
