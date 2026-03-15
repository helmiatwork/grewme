# app/policies/

## Responsibility
22 Pundit authorization policies defining what actions each user role can perform on each resource. Implements Role-Based Access Control (RBAC) with per-user permission overrides.

## Design
- **ApplicationPolicy** base class: Default deny-all (`false` for all actions)
- **One policy per model**: ClassroomPolicy, StudentPolicy, ExamPolicy, etc.
- **Scope inner class**: Filters query results based on user role (e.g., teachers see only their classrooms)
- **`permitted?` helper**: Delegates to `user.has_permission?(action, resource_name)` which checks `RolePermissions::DEFAULTS` then user-specific overrides
- **`resource_name` helper**: Maps policy class to permission resource name

### Authorization Flow:
```
Mutation calls authorize!(record, :action?)
  → Pundit finds PolicyClass (e.g., ClassroomPolicy)
  → Policy#action? method runs
  → Checks user.has_permission? via Permissionable concern
  → RolePermissions::DEFAULTS checked first
  → Per-user Permission overrides checked second
  → Returns true/false
  → Raises Pundit::NotAuthorizedError on false
```

## Flow
1. BaseMutation calls `authorize!(record, :create?)` or similar
2. Pundit resolves policy class from record type
3. Policy checks role-based permissions via Permissionable concern
4. Scope filters collections for index/list queries
5. Unauthorized access raises error → GraphQL returns error response

## Integration
- **Called by**: BaseMutation.authorize!, QueryType scope resolution
- **Depends on**: Permissionable concern on user models
- **Depends on**: RolePermissions::DEFAULTS in `config/initializers/role_permissions.rb`
- **Depends on**: Permission model for per-user overrides
