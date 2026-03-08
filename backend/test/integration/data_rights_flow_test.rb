# frozen_string_literal: true

require "test_helper"

class DataRightsFlowTest < ActiveSupport::TestCase
  EXPORT_DATA = <<~GQL
    mutation($studentId: ID!) {
      exportChildData(studentId: $studentId) {
        data
        errors { message path }
      }
    }
  GQL

  REQUEST_DELETION = <<~GQL
    mutation($reason: String) {
      requestAccountDeletion(reason: $reason) {
        deletionRequest { id status gracePeriodEndsAt }
        errors { message path }
      }
    }
  GQL

  DELETE_CHILD_DATA = <<~GQL
    mutation($studentId: ID!) {
      requestChildDataDeletion(studentId: $studentId) {
        success
        errors { message path }
      }
    }
  GQL

  test "parent exports child data" do
    parent = parents(:parent_carol)
    student = students(:student_emma)
    ParentStudent.find_or_create_by!(parent: parent, student: student)

    result = execute_query(
      mutation: EXPORT_DATA,
      variables: { studentId: student.id.to_s },
      user: parent
    )
    data = gql_data(result)["exportChildData"]
    assert_empty data["errors"]
    assert_not_nil data["data"]
    assert_not_nil data["data"]["student"]
    assert_not_nil data["data"]["exported_at"]

    # Verify audit log
    assert AuditLog.exists?(event_type: "STUDENT_EXPORT")
  end

  test "parent requests and data is deleted" do
    parent = parents(:parent_carol)
    student = students(:student_emma)
    ParentStudent.find_or_create_by!(parent: parent, student: student)

    # Create some data to delete
    teacher = teachers(:teacher_alice)
    DailyScore.create!(student: student, teacher: teacher, date: Date.current, skill_category: :reading, score: 85)

    assert student.daily_scores.count > 0

    # Parent requests child data deletion
    result = execute_query(
      mutation: DELETE_CHILD_DATA,
      variables: { studentId: student.id.to_s },
      user: parent
    )
    data = gql_data(result)["requestChildDataDeletion"]
    assert_empty data["errors"]
    assert data["success"]

    # Verify data is deleted
    assert_equal 0, student.daily_scores.reload.count
  end

  test "account deletion with grace period" do
    parent = parents(:parent_carol)

    result = execute_query(
      mutation: REQUEST_DELETION,
      variables: { reason: "Moving to another platform" },
      user: parent
    )
    data = gql_data(result)["requestAccountDeletion"]
    assert_empty data["errors"]
    assert_equal "pending", data["deletionRequest"]["status"]
    assert_not_nil data["deletionRequest"]["gracePeriodEndsAt"]

    # Verify grace period is ~30 days from now
    grace_end = Time.parse(data["deletionRequest"]["gracePeriodEndsAt"])
    assert_in_delta 30.days.from_now.to_i, grace_end.to_i, 60 # within 60 seconds
  end
end
