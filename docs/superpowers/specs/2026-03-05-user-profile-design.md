# User Profile & Account Settings — Design

## Goal

Allow teachers and parents to view and edit their profile (name, email, phone, bio, birthdate, gender, religion, qualification, address) and avatar photo, plus change their password.

## Architecture

Single polymorphic `updateProfile` mutation that works for both Teacher and Parent. Detects `current_user` type and updates accordingly. Teacher-only fields (`religion`) are silently ignored for Parents. Avatar uses Active Storage (`has_one_attached :avatar_image`) uploaded via the existing BFF upload proxy. A separate `changePassword` mutation handles password changes with current-password verification.

## Data Model

Both `teachers` and `parents` tables already have all profile columns:
- `name`, `email`, `phone`, `bio`, `birthdate`, `gender`, `qualification`, `religion` (teacher-only)
- `address_line1`, `address_line2`, `city`, `state_province`, `postal_code`, `country_code`
- `avatar` (string — will be replaced by Active Storage `has_one_attached`)

## GraphQL API

### `updateProfile` mutation
- Accepts all profile fields as optional arguments
- `avatarBlobId: String` — signed blob ID from upload flow
- Returns updated user via `UserUnion`
- Auth: must be logged in, can only update self

### `changePassword` mutation
- `currentPassword: String!`, `newPassword: String!`, `newPasswordConfirmation: String!`
- Returns `{ success: Boolean, errors: [UserError] }`
- Auth: must be logged in

### Extended types
- `TeacherType` and `ParentType` gain all profile fields + `avatarUrl`
- `me` query already returns `UserUnion` — no changes needed

## Frontend

- `/teacher/profile` and `/parent/profile` routes
- Shared `ProfileForm` component with role-conditional fields
- Avatar upload reuses `FilePicker` + `/api/upload` BFF proxy
- Password change section at bottom of profile page
- Nav link added to both teacher and parent layouts
