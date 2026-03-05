# frozen_string_literal: true

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

    # Mutation should succeed (religion arg is silently ignored for parents)
    assert_nil result["errors"]
    user = result.dig("data", "updateProfile", "user")
    assert_not_nil user
    # Parent model has no religion column — confirm no errors were raised
    assert_empty result.dig("data", "updateProfile", "errors")
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
