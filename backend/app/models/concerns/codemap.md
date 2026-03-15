# app/models/concerns/

## Responsibility
Shared model behaviors extracted into reusable modules. Provides cross-cutting functionality used by multiple models.

## Design
- **Permissionable**: Adds `has_permission?(action, resource)` to user models. Checks `RolePermissions::DEFAULTS` hash for role-based access, with per-user permission overrides via `Permission` model.
- **AccessCodeGenerator**: Generates unique alphanumeric access codes (e.g., for exam entry). Uses `SecureRandom` with collision checks.

## Flow
1. Model includes concern → gains instance methods
2. `has_permission?` checks default role permissions first, then user-specific overrides
3. `generate_access_code` creates unique codes on model creation

## Integration
- **Permissionable** consumed by: Teacher, Parent, SchoolManager — used by Pundit policies for authorization
- **AccessCodeGenerator** consumed by: Exam model — generates access codes for Kahoot-style exam entry
