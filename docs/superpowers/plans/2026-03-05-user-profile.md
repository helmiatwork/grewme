# User Profile & Account Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow teachers and parents to view/edit their profile (personal info, address, avatar photo) and change their password.

**Architecture:** Single polymorphic `updateProfile` mutation + `changePassword` mutation. Avatar via Active Storage `has_one_attached`. Frontend profile pages at `/teacher/profile` and `/parent/profile`.

**Tech Stack:** Rails 8.1 + GraphQL, SvelteKit + Svelte 5 + Tailwind CSS v4

---

### Task 1: Add `has_one_attached :avatar_image` to Teacher and Parent models

**Files:**
- Modify: `backend/app/models/teacher.rb`
- Modify: `backend/app/models/parent.rb`

**Step 1: Add Active Storage attachment to Teacher model**

In `backend/app/models/teacher.rb`, add after `has_many :feed_posts`:

```ruby
has_one_attached :avatar_image
```

**Step 2: Add Active Storage attachment to Parent model**

In `backend/app/models/parent.rb`, add after `has_many :permissions`:

```ruby
has_one_attached :avatar_image
```

**Step 3: Verify models load**

Run: `cd backend && bin/rails runner "puts Teacher.new.respond_to?(:avatar_image); puts Parent.new.respond_to?(:avatar_image)"`
Expected: `true` twice

**Step 4: Commit**

```bash
git add backend/app/models/teacher.rb backend/app/models/parent.rb
git commit -m "feat(profile): add has_one_attached :avatar_image to Teacher and Parent"
```

---

### Task 2: Extend TeacherType and ParentType with profile fields

**Files:**
- Modify: `backend/app/graphql/types/teacher_type.rb`
- Modify: `backend/app/graphql/types/parent_type.rb`

**Step 1: Extend TeacherType**

Replace `backend/app/graphql/types/teacher_type.rb` with:

```ruby
# frozen_string_literal: true

module Types
  class TeacherType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :phone, String
    field :bio, String
    field :birthdate, GraphQL::Types::ISO8601Date
    field :gender, String
    field :religion, String
    field :qualification, String
    field :address_line1, String
    field :address_line2, String
    field :city, String
    field :state_province, String
    field :postal_code, String
    field :country_code, String
    field :avatar_url, String
    field :classrooms, [Types::ClassroomType], null: false

    def avatar_url
      if object.avatar_image.attached?
        Rails.application.routes.url_helpers.url_for(object.avatar_image)
      end
    end

    def classrooms
      object.classrooms
    end
  end
end
```

**Step 2: Extend ParentType**

Replace `backend/app/graphql/types/parent_type.rb` with:

```ruby
# frozen_string_literal: true

module Types
  class ParentType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :phone, String
    field :bio, String
    field :birthdate, GraphQL::Types::ISO8601Date
    field :gender, String
    field :qualification, String
    field :address_line1, String
    field :address_line2, String
    field :city, String
    field :state_province, String
    field :postal_code, String
    field :country_code, String
    field :avatar_url, String
    field :children, [Types::StudentType], null: false

    def avatar_url
      if object.avatar_image.attached?
        Rails.application.routes.url_helpers.url_for(object.avatar_image)
      end
    end

    def children
      object.children
    end
  end
end
```

**Step 3: Verify schema loads**

Run: `cd backend && bin/rails runner "puts GrewmeSchema.to_definition.include?('avatarUrl')"`
Expected: `true`

**Step 4: Commit**

```bash
git add backend/app/graphql/types/teacher_type.rb backend/app/graphql/types/parent_type.rb
git commit -m "feat(profile): expose all profile fields + avatarUrl on TeacherType and ParentType"
```

---

### Task 3: Create `updateProfile` mutation

**Files:**
- Create: `backend/app/graphql/mutations/update_profile.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`

**Step 1: Create the mutation**

Create `backend/app/graphql/mutations/update_profile.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class UpdateProfile < BaseMutation
    argument :name, String, required: false
    argument :email, String, required: false
    argument :phone, String, required: false
    argument :bio, String, required: false
    argument :birthdate, GraphQL::Types::ISO8601Date, required: false
    argument :gender, String, required: false
    argument :religion, String, required: false
    argument :qualification, String, required: false
    argument :address_line1, String, required: false
    argument :address_line2, String, required: false
    argument :city, String, required: false
    argument :state_province, String, required: false
    argument :postal_code, String, required: false
    argument :country_code, String, required: false
    argument :avatar_blob_id, String, required: false

    field :user, Types::UserUnion
    field :errors, [Types::UserErrorType], null: false

    PERMITTED_FIELDS = %i[
      name email phone bio birthdate gender qualification
      address_line1 address_line2 city state_province postal_code country_code
    ].freeze

    TEACHER_ONLY_FIELDS = %i[religion].freeze

    def resolve(**args)
      authenticate!

      attrs = args.slice(*PERMITTED_FIELDS)
      if current_user.teacher?
        attrs.merge!(args.slice(*TEACHER_ONLY_FIELDS))
      end
      attrs.compact!

      if args[:avatar_blob_id].present?
        blob = ActiveStorage::Blob.find_signed!(args[:avatar_blob_id])
        current_user.avatar_image.attach(blob)
      end

      if current_user.update(attrs)
        { user: current_user, errors: [] }
      else
        {
          user: nil,
          errors: current_user.errors.map { |e|
            { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] }
          }
        }
      end
    end
  end
end
```

**Step 2: Register in MutationType**

In `backend/app/graphql/types/mutation_type.rb`, add after the Uploads section:

```ruby
    # Profile
    field :update_profile, mutation: Mutations::UpdateProfile
    field :change_password, mutation: Mutations::ChangePassword
```

(We'll create ChangePassword in the next task — just register both now.)

**Step 3: Commit**

```bash
git add backend/app/graphql/mutations/update_profile.rb backend/app/graphql/types/mutation_type.rb
git commit -m "feat(profile): add updateProfile mutation"
```

---

### Task 4: Create `changePassword` mutation

**Files:**
- Create: `backend/app/graphql/mutations/change_password.rb`

**Step 1: Create the mutation**

Create `backend/app/graphql/mutations/change_password.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class ChangePassword < BaseMutation
    argument :current_password, String, required: true
    argument :new_password, String, required: true
    argument :new_password_confirmation, String, required: true

    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(current_password:, new_password:, new_password_confirmation:)
      authenticate!

      unless current_user.valid_password?(current_password)
        return { success: false, errors: [{ message: "Current password is incorrect", path: ["currentPassword"] }] }
      end

      if current_user.update(password: new_password, password_confirmation: new_password_confirmation)
        { success: true, errors: [] }
      else
        {
          success: false,
          errors: current_user.errors.map { |e|
            { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] }
          }
        }
      end
    end
  end
end
```

**Step 2: Verify schema loads**

Run: `cd backend && bin/rails runner "puts GrewmeSchema.to_definition.include?('changePassword')"`
Expected: `true`

**Step 3: Commit**

```bash
git add backend/app/graphql/mutations/change_password.rb
git commit -m "feat(profile): add changePassword mutation"
```

---

### Task 5: Write backend tests for updateProfile and changePassword

**Files:**
- Create: `backend/test/graphql/mutations/profile_test.rb`

**Step 1: Write tests**

Create `backend/test/graphql/mutations/profile_test.rb`:

```ruby
require "test_helper"

class ProfileMutationsTest < ActiveSupport::TestCase
  setup do
    Rails.application.routes.default_url_options[:host] = "example.com"
  end

  test "teacher updates profile fields" do
    result = execute_query(
      mutation: 'mutation($name: String, $phone: String, $bio: String, $religion: String) {
        updateProfile(name: $name, phone: $phone, bio: $bio, religion: $religion) {
          user {
            ... on Teacher { id name phone bio religion }
          }
          errors { message }
        }
      }',
      variables: { name: "Alice Updated", phone: "+1234567890", bio: "I love teaching", religion: "Buddhist" },
      user: teachers(:teacher_alice)
    )

    user = result.dig("data", "updateProfile", "user")
    assert_not_nil user
    assert_equal "Alice Updated", user["name"]
    assert_equal "+1234567890", user["phone"]
    assert_equal "I love teaching", user["bio"]
    assert_equal "Buddhist", user["religion"]
  end

  test "parent updates profile fields" do
    result = execute_query(
      mutation: 'mutation($name: String, $phone: String, $bio: String, $city: String) {
        updateProfile(name: $name, phone: $phone, bio: $bio, city: $city) {
          user {
            ... on Parent { id name phone bio city }
          }
          errors { message }
        }
      }',
      variables: { name: "Carol Updated", phone: "+9876543210", bio: "Proud parent", city: "Seattle" },
      user: parents(:parent_carol)
    )

    user = result.dig("data", "updateProfile", "user")
    assert_not_nil user
    assert_equal "Carol Updated", user["name"]
    assert_equal "+9876543210", user["phone"]
    assert_equal "Proud parent", user["bio"]
    assert_equal "Seattle", user["city"]
  end

  test "parent cannot set religion (teacher-only field)" do
    result = execute_query(
      mutation: 'mutation($religion: String) {
        updateProfile(religion: $religion) {
          user {
            ... on Parent { id name }
          }
          errors { message }
        }
      }',
      variables: { religion: "Should be ignored" },
      user: parents(:parent_carol)
    )

    user = result.dig("data", "updateProfile", "user")
    assert_not_nil user
    parents(:parent_carol).reload
    assert_nil parents(:parent_carol).religion
  end

  test "unauthenticated user cannot update profile" do
    result = execute_query(
      mutation: 'mutation($name: String) {
        updateProfile(name: $name) {
          user { ... on Teacher { id } }
          errors { message }
        }
      }',
      variables: { name: "Hacker" }
    )

    errors = result["errors"]
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("Authentication") }
  end

  test "teacher changes password successfully" do
    result = execute_query(
      mutation: 'mutation($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
        changePassword(currentPassword: $currentPassword, newPassword: $newPassword, newPasswordConfirmation: $newPasswordConfirmation) {
          success
          errors { message path }
        }
      }',
      variables: { currentPassword: "password123", newPassword: "newpass456", newPasswordConfirmation: "newpass456" },
      user: teachers(:teacher_alice)
    )

    assert_equal true, result.dig("data", "changePassword", "success")
    assert teachers(:teacher_alice).reload.valid_password?("newpass456")
  end

  test "change password fails with wrong current password" do
    result = execute_query(
      mutation: 'mutation($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
        changePassword(currentPassword: $currentPassword, newPassword: $newPassword, newPasswordConfirmation: $newPasswordConfirmation) {
          success
          errors { message path }
        }
      }',
      variables: { currentPassword: "wrongpassword", newPassword: "newpass456", newPasswordConfirmation: "newpass456" },
      user: teachers(:teacher_alice)
    )

    assert_equal false, result.dig("data", "changePassword", "success")
    errors = result.dig("data", "changePassword", "errors")
    assert errors.any? { |e| e["message"].include?("incorrect") }
  end

  test "change password fails with mismatched confirmation" do
    result = execute_query(
      mutation: 'mutation($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
        changePassword(currentPassword: $currentPassword, newPassword: $newPassword, newPasswordConfirmation: $newPasswordConfirmation) {
          success
          errors { message path }
        }
      }',
      variables: { currentPassword: "password123", newPassword: "newpass456", newPasswordConfirmation: "different" },
      user: teachers(:teacher_alice)
    )

    assert_equal false, result.dig("data", "changePassword", "success")
  end

  test "teacher updates avatar with signed blob id" do
    blob = ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("fake image data"),
      filename: "avatar.jpg",
      content_type: "image/jpeg"
    )

    result = execute_query(
      mutation: 'mutation($avatarBlobId: String) {
        updateProfile(avatarBlobId: $avatarBlobId) {
          user {
            ... on Teacher { id avatarUrl }
          }
          errors { message }
        }
      }',
      variables: { avatarBlobId: blob.signed_id },
      user: teachers(:teacher_alice)
    )

    user = result.dig("data", "updateProfile", "user")
    assert_not_nil user
    assert_not_nil user["avatarUrl"]
    assert teachers(:teacher_alice).reload.avatar_image.attached?
  end
end
```

**Step 2: Run tests**

Run: `cd backend && bin/rails test test/graphql/mutations/profile_test.rb`
Expected: 8 tests, 0 failures

**Step 3: Commit**

```bash
git add backend/test/graphql/mutations/profile_test.rb
git commit -m "test(profile): add tests for updateProfile and changePassword mutations"
```

---

### Task 6: Add frontend GraphQL queries for profile

**Files:**
- Create: `front-end/src/lib/api/queries/profile.ts`
- Modify: `front-end/src/lib/api/types.ts`
- Modify: `front-end/src/lib/api/queries/auth.ts`

**Step 1: Create profile queries**

Create `front-end/src/lib/api/queries/profile.ts`:

```typescript
export const PROFILE_QUERY = `
  query Me {
    me {
      ... on Teacher {
        id name email role phone bio birthdate gender religion qualification
        addressLine1 addressLine2 city stateProvince postalCode countryCode
        avatarUrl
        classrooms { id name }
      }
      ... on Parent {
        id name email role phone bio birthdate gender qualification
        addressLine1 addressLine2 city stateProvince postalCode countryCode
        avatarUrl
        children { id name }
      }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile(
    $name: String, $email: String, $phone: String, $bio: String,
    $birthdate: ISO8601Date, $gender: String, $religion: String, $qualification: String,
    $addressLine1: String, $addressLine2: String, $city: String,
    $stateProvince: String, $postalCode: String, $countryCode: String,
    $avatarBlobId: String
  ) {
    updateProfile(
      name: $name, email: $email, phone: $phone, bio: $bio,
      birthdate: $birthdate, gender: $gender, religion: $religion, qualification: $qualification,
      addressLine1: $addressLine1, addressLine2: $addressLine2, city: $city,
      stateProvince: $stateProvince, postalCode: $postalCode, countryCode: $countryCode,
      avatarBlobId: $avatarBlobId
    ) {
      user {
        ... on Teacher {
          id name email phone bio birthdate gender religion qualification
          addressLine1 addressLine2 city stateProvince postalCode countryCode
          avatarUrl
        }
        ... on Parent {
          id name email phone bio birthdate gender qualification
          addressLine1 addressLine2 city stateProvince postalCode countryCode
          avatarUrl
        }
      }
      errors { message path }
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword, newPasswordConfirmation: $newPasswordConfirmation) {
      success
      errors { message path }
    }
  }
`;
```

**Step 2: Update types.ts**

Add profile fields to Teacher and Parent interfaces, and add a UserProfile type.

**Step 3: Update ME_QUERY in auth.ts to include avatarUrl**

**Step 4: Commit**

```bash
git add front-end/src/lib/api/queries/profile.ts front-end/src/lib/api/types.ts front-end/src/lib/api/queries/auth.ts
git commit -m "feat(profile): add frontend GraphQL queries and types for profile"
```

---

### Task 7: Create teacher profile page

**Files:**
- Create: `front-end/src/routes/teacher/profile/+page.server.ts`
- Create: `front-end/src/routes/teacher/profile/+page.svelte`
- Modify: `front-end/src/routes/teacher/+layout.svelte` (add nav link)

**Step 1: Create server load**

Load full profile data via PROFILE_QUERY.

**Step 2: Create profile page**

Form with sections: Avatar, Personal Info, Address, Bio, Password Change. Uses client-side submission via BFF proxy for mutations and avatar upload.

**Step 3: Add nav link**

Add `{ label: 'Profile', href: '/teacher/profile', icon: '👤' }` to teacher layout navItems.

**Step 4: Commit**

```bash
git add front-end/src/routes/teacher/profile/ front-end/src/routes/teacher/+layout.svelte
git commit -m "feat(profile): add teacher profile page"
```

---

### Task 8: Create parent profile page

**Files:**
- Create: `front-end/src/routes/parent/profile/+page.server.ts`
- Create: `front-end/src/routes/parent/profile/+page.svelte`
- Modify: `front-end/src/routes/parent/+layout.svelte` (add nav link)

**Step 1-4:** Same as Task 7 but for parent route. No `religion` field.

**Step 4: Commit**

```bash
git add front-end/src/routes/parent/profile/ front-end/src/routes/parent/+layout.svelte
git commit -m "feat(profile): add parent profile page"
```

---

### Task 9: Run full test suite + svelte-check + build

**Step 1: Backend tests**

Run: `cd backend && bin/rails test`
Expected: All pass (previous 141 + 8 new = ~149)

**Step 2: Frontend checks**

Run: `cd front-end && npx svelte-check && npm run build`
Expected: 0 errors, build success

**Step 3: Commit any fixes if needed**
