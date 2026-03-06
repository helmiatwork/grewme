# frozen_string_literal: true

require "test_helper"

class CreateSubjectMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($input: CreateSubjectInput!) {
      createSubject(input: $input) {
        subject { id name description }
        errors { message path }
      }
    }
  GQL

  test "teacher can create a subject" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: { name: "Science", description: "Natural sciences", schoolId: schools(:greenwood).id.to_s }
      },
      user: teacher
    )

    data = result["data"]["createSubject"]
    assert_empty data["errors"]
    assert_equal "Science", data["subject"]["name"]
  end

  test "returns errors for duplicate name in same school" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: { name: "Mathematics", schoolId: schools(:greenwood).id.to_s }
      },
      user: teacher
    )

    data = result["data"]["createSubject"]
    assert_not_empty data["errors"]
  end

  test "unauthenticated user cannot create subject" do
    result = execute_query(
      mutation: MUTATION,
      variables: {
        input: { name: "Science", schoolId: schools(:greenwood).id.to_s }
      }
    )

    assert result["errors"].present? || result.dig("data", "createSubject", "errors")&.any?
  end
end
