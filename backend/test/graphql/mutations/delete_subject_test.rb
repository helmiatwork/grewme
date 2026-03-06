# frozen_string_literal: true

require "test_helper"

class DeleteSubjectMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation($id: ID!) {
      deleteSubject(id: $id) {
        success
        errors { message path }
      }
    }
  GQL

  test "teacher can delete a subject" do
    teacher = teachers(:teacher_alice)
    subject = Subject.create!(name: "Temp Subject", school: schools(:greenwood))
    result = execute_query(
      mutation: MUTATION,
      variables: { id: subject.id.to_s },
      user: teacher
    )
    data = result["data"]["deleteSubject"]
    assert data["success"]
    assert_raises(ActiveRecord::RecordNotFound) { subject.reload }
  end

  test "deleting subject cascades to topics" do
    teacher = teachers(:teacher_alice)
    subject = Subject.create!(name: "Temp", school: schools(:greenwood))
    subject.topics.create!(name: "Temp Topic")

    assert_difference "Topic.count", -1 do
      execute_query(
        mutation: MUTATION,
        variables: { id: subject.id.to_s },
        user: teacher
      )
    end
  end

  test "parent cannot delete a subject" do
    parent = parents(:parent_carol)
    result = execute_query(
      mutation: MUTATION,
      variables: { id: subjects(:math).id.to_s },
      user: parent
    )
    assert result["errors"].present?
  end
end
