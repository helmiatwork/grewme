# frozen_string_literal: true

require "test_helper"

class DataRightsMutationsTest < ActiveSupport::TestCase
  EXPORT_CHILD_DATA_MUTATION = <<~GRAPHQL
    mutation($studentId: ID!) {
      exportChildData(studentId: $studentId) {
        data
        errors { message path }
      }
    }
  GRAPHQL

  REQUEST_ACCOUNT_DELETION_MUTATION = <<~GRAPHQL
    mutation($reason: String) {
      requestAccountDeletion(reason: $reason) {
        deletionRequest { id status gracePeriodEndsAt reason }
        errors { message path }
      }
    }
  GRAPHQL

  REQUEST_CHILD_DATA_DELETION_MUTATION = <<~GRAPHQL
    mutation($studentId: ID!) {
      requestChildDataDeletion(studentId: $studentId) {
        success
        errors { message path }
      }
    }
  GRAPHQL

  setup do
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
    @teacher = teachers(:teacher_alice)
    # Ensure parent-student link exists
    ParentStudent.find_or_create_by!(parent: @parent, student: @student)
  end

  # === exportChildData ===

  test "parent exports child data successfully" do
    result = execute_query(
      mutation: EXPORT_CHILD_DATA_MUTATION,
      variables: { studentId: @student.id.to_s },
      user: @parent
    )

    data = gql_data(result)
    assert_not_nil data
    assert_empty data["exportChildData"]["errors"]
    assert_not_nil data["exportChildData"]["data"]
    export = data["exportChildData"]["data"]
    assert_equal @student.name, export["student"]["name"]
    assert_includes export.keys, "exported_at"
  end

  test "non-parent cannot export child data" do
    result = execute_query(
      mutation: EXPORT_CHILD_DATA_MUTATION,
      variables: { studentId: @student.id.to_s },
      user: @teacher
    )
    assert result["errors"].present? || result.dig("data", "exportChildData").nil?
  end

  test "parent cannot export unlinked student data" do
    other_student = students(:student_finn)
    # Remove any link if exists
    ParentStudent.where(parent: @parent, student: other_student).destroy_all

    result = execute_query(
      mutation: EXPORT_CHILD_DATA_MUTATION,
      variables: { studentId: other_student.id.to_s },
      user: @parent
    )
    assert result["errors"].present? || result.dig("data", "exportChildData").nil?
  end

  # === requestAccountDeletion ===

  test "creates deletion request with 30-day grace period" do
    result = execute_query(
      mutation: REQUEST_ACCOUNT_DELETION_MUTATION,
      variables: { reason: "No longer using the app" },
      user: @parent
    )

    data = gql_data(result)
    assert_not_nil data
    assert_empty data["requestAccountDeletion"]["errors"]
    deletion_request = data["requestAccountDeletion"]["deletionRequest"]
    assert_not_nil deletion_request
    assert_equal "pending", deletion_request["status"]
    assert_not_nil deletion_request["gracePeriodEndsAt"]

    # Verify grace period is ~30 days from now
    grace_period = Time.parse(deletion_request["gracePeriodEndsAt"])
    assert_in_delta 30.days.from_now.to_i, grace_period.to_i, 60
  end

  test "rejects duplicate pending deletion request" do
    # Create first request
    AccountDeletionRequest.create!(
      user_type: @parent.class.name,
      user_id: @parent.id
    )

    result = execute_query(
      mutation: REQUEST_ACCOUNT_DELETION_MUTATION,
      variables: {},
      user: @parent
    )

    data = gql_data(result)
    assert_not_nil data
    assert_not_empty data["requestAccountDeletion"]["errors"]
    assert_match(/pending deletion request/i, data["requestAccountDeletion"]["errors"].first["message"])
  end

  # === requestChildDataDeletion ===

  test "parent deletes child learning data" do
    result = execute_query(
      mutation: REQUEST_CHILD_DATA_DELETION_MUTATION,
      variables: { studentId: @student.id.to_s },
      user: @parent
    )

    data = gql_data(result)
    assert_not_nil data
    assert_empty data["requestChildDataDeletion"]["errors"]
    assert data["requestChildDataDeletion"]["success"]

    # Verify learning data deleted
    assert_equal 0, @student.reload.daily_scores.count
    assert_equal 0, @student.exam_submissions.count
    assert_equal 0, @student.objective_masteries.count
  end

  test "non-parent cannot delete child data" do
    result = execute_query(
      mutation: REQUEST_CHILD_DATA_DELETION_MUTATION,
      variables: { studentId: @student.id.to_s },
      user: @teacher
    )
    assert result["errors"].present? || result.dig("data", "requestChildDataDeletion").nil?
  end
end
