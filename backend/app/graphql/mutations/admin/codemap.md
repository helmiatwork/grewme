# app/graphql/mutations/admin/

## Responsibility
Admin-only mutations for permission management and school administration. Restricted to users with admin or school_manager roles.

## Design
- Inherits from BaseMutation with additional admin role checks
- Mutations: GrantPermission, RevokePermission, BulkUpdatePermissions
- Operates on Permission model for per-user RBAC overrides

## Flow
1. Admin user calls mutation
2. `authenticate!` + `authorize!` (admin policy)
3. Create/update/delete Permission records
4. AuditLogger records the permission change

## Integration
- **Modifies**: Permission model (RBAC overrides)
- **Affects**: Pundit policy evaluation for target users
- **Audit logged**: All permission changes recorded for compliance
