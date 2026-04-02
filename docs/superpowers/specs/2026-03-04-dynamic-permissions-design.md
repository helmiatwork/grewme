# Design: Dynamic Permissions System

## Problem

Pundit policies currently hardcode role-based checks (`user.teacher?`, `user.admin?`). An admin cannot grant or revoke specific permissions per user at runtime.

## Decision

**Approach A: Single `permissions` table** with role defaults + per-user overrides.

- Action-level granularity per resource (e.g. `classrooms.show`, `daily_scores.create`)
- Roles provide baseline permissions; the `permissions` table adds grants or revokes
- Ownership checks (my classroom, my student) remain enforced on top

## Data Model

```sql
CREATE TABLE permissions (
  id bigint PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource varchar NOT NULL,   -- "classrooms", "students", "daily_scores", "children"
  action varchar NOT NULL,     -- "index", "show", "create", "update", "destroy", "overview", "radar", "progress"
  granted boolean NOT NULL DEFAULT true,  -- false = revoke a role default
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL
);

CREATE UNIQUE INDEX index_permissions_on_user_resource_action
  ON permissions (user_id, resource, action);
```

## Role Defaults

Hardcoded in a config constant (version-controlled, not in DB):

```ruby
# config/initializers/role_permissions.rb or a concern constant
ROLE_DEFAULTS = {
  teacher: {
    "classrooms"   => %w[index show overview],
    "students"     => %w[show radar progress],
    "daily_scores" => %w[index create update]
  },
  parent: {
    "students"     => %w[show radar progress],
    "daily_scores" => %w[index],
    "children"     => %w[index]
  },
  admin: :all
}.freeze
```

## Permission Resolution

For any `(user, resource, action)`:

1. Check `permissions` table for a row matching `(user_id, resource, action)`
   - If found with `granted: true` → **allowed** (extra grant beyond role)
   - If found with `granted: false` → **denied** (revoke role default)
2. If no row → fall back to role defaults
3. Ownership checks still apply on top (unchanged Pundit logic)

## Pundit Policy Changes

Policies change from role checks to permission checks + ownership:

```ruby
# Before
def show?
  user.admin? || owns_classroom?
end

# After
def show?
  has_permission?(:show) && (user.admin? || owns_classroom?)
end
```

The `has_permission?` method lives in a `Permissionable` concern included in `ApplicationPolicy`.

## Admin API

```
GET    /api/v1/admin/users/:user_id/permissions      — list effective permissions
POST   /api/v1/admin/users/:user_id/permissions      — grant/revoke permission
DELETE /api/v1/admin/users/:user_id/permissions/:id   — remove override (revert to default)
PATCH  /api/v1/admin/users/:user_id/permissions/:id   — toggle granted
```

Admin-only via `PermissionPolicy`.

## Files to Create/Modify

| File | Change |
|------|--------|
| `db/migrate/*_create_permissions.rb` | New table |
| `app/models/permission.rb` | Model with validations, unique constraint |
| `app/models/user.rb` | Add `has_many :permissions` |
| `app/models/concerns/permissionable.rb` | `has_permission?`, `role_allows?`, `effective_permissions` |
| `app/policies/application_policy.rb` | Include Permissionable |
| `app/policies/classroom_policy.rb` | Use `has_permission?` + ownership |
| `app/policies/student_policy.rb` | Use `has_permission?` + ownership |
| `app/policies/daily_score_policy.rb` | Use `has_permission?` + ownership |
| `app/policies/permission_policy.rb` | Admin-only |
| `app/controllers/api/v1/admin/permissions_controller.rb` | CRUD for permissions |
| `app/resources/permission_resource.rb` | Alba serializer |
| `config/routes.rb` | Add admin namespace |
| Tests | Permission model, Permissionable concern, controller, updated policy tests |

## Alternatives Considered

- **B: permission_sets + overrides** — reusable groups, but overkill for current scale
- **C: JSONB column on users** — simple but hard to query, no audit trail

## Date

2026-03-04
