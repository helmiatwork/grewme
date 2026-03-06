# frozen_string_literal: true

require "test_helper"

class UpdateSubjectMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($input: UpdateSubjectInput!) {
      updateSubject(input: $input) {
        subject { id name description }
        errors { message path }
      }
    }
  GQL

  test "teacher can update a subject" do
    teacher = teachers(:teacher_alice)
    subject = subjects(:math)
    result = execute_query(
      mutation: MUTATION,
      variables: { input: { id: subject.id.to_s, name: "Advanced Mathematics", description: "Updated desc" } },
      user: teacher
    )
    data = result["data"]["updateSubject"]
    assert_empty data["errors"]
    assert_equal "Advanced Mathematics", data["subject"]["name"]
    assert_equal "Updated desc", data["subject"]["description"]
  end

  test "returns errors for duplicate name" do
    teacher = teachers(:teacher_alice)
    subject = subjects(:math)
    result = execute_query(
      mutation: MUTATION,
      variables: { input: { id: subject.id.to_s, name: "Reading" } },
      user: teacher
    )
    data = result["data"]["updateSubject"]
    assert_not_empty data["errors"]
  end

  test "unauthenticated user cannot update" do
    subject = subjects(:math)
    result = execute_query(
      mutation: MUTATION,
      variables: { input: { id: subject.id.to_s, name: "New Name" } }
    )
    assert result["errors"].present?
  end
end
