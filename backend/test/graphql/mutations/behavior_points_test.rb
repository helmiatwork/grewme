require "test_helper"

class BehaviorPointsMutationTest < ActiveSupport::TestCase
  AWARD_MUTATION = <<~GRAPHQL
    mutation($studentId: ID!, $classroomId: ID!, $behaviorCategoryId: ID!, $note: String) {
      awardBehaviorPoint(studentId: $studentId, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId, note: $note) {
        behaviorPoint { id pointValue note awardedAt behaviorCategory { name } }
        dailyTotal
        errors { message path }
      }
    }
  GRAPHQL

  BATCH_MUTATION = <<~GRAPHQL
    mutation($studentIds: [ID!]!, $classroomId: ID!, $behaviorCategoryId: ID!) {
      batchAwardBehaviorPoints(studentIds: $studentIds, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId) {
        behaviorPoints { id pointValue student { id } }
        errors { message path }
      }
    }
  GRAPHQL

  REVOKE_MUTATION = <<~GRAPHQL
    mutation($id: ID!) {
      revokeBehaviorPoint(id: $id) {
        behaviorPoint { id revokedAt }
        errors { message path }
      }
    }
  GRAPHQL

  test "teacher awards behavior point" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    classroom = classrooms(:alice_class)
    category = behavior_categories(:helping_others)

    result = execute_query(
      mutation: AWARD_MUTATION,
      variables: {
        studentId: student.id.to_s,
        classroomId: classroom.id.to_s,
        behaviorCategoryId: category.id.to_s,
        note: "Helped a classmate"
      },
      user: teacher
    )

    data = gql_data(result)["awardBehaviorPoint"]
    assert_empty data["errors"]
    assert_equal 3, data["behaviorPoint"]["pointValue"]
    assert_equal "Helping Others", data["behaviorPoint"]["behaviorCategory"]["name"]
    assert_equal "Helped a classmate", data["behaviorPoint"]["note"]
  end

  test "teacher batch awards to multiple students" do
    teacher = teachers(:teacher_alice)
    classroom = classrooms(:alice_class)
    category = behavior_categories(:teamwork)
    student_ids = [ students(:student_emma).id.to_s, students(:student_finn).id.to_s ]

    result = execute_query(
      mutation: BATCH_MUTATION,
      variables: {
        studentIds: student_ids,
        classroomId: classroom.id.to_s,
        behaviorCategoryId: category.id.to_s
      },
      user: teacher
    )

    data = gql_data(result)["batchAwardBehaviorPoints"]
    assert_empty data["errors"]
    assert_equal 2, data["behaviorPoints"].length
  end

  test "teacher revokes point within 15 minutes" do
    teacher = teachers(:teacher_alice)
    point = behavior_points(:emma_helping)
    point.update!(awarded_at: 5.minutes.ago)

    result = execute_query(
      mutation: REVOKE_MUTATION,
      variables: { id: point.id.to_s },
      user: teacher
    )

    data = gql_data(result)["revokeBehaviorPoint"]
    assert_empty data["errors"]
    assert_not_nil data["behaviorPoint"]["revokedAt"]
  end

  test "teacher cannot revoke after 15 minutes" do
    teacher = teachers(:teacher_alice)
    point = behavior_points(:emma_helping)
    point.update!(awarded_at: 20.minutes.ago)

    result = execute_query(
      mutation: REVOKE_MUTATION,
      variables: { id: point.id.to_s },
      user: teacher
    )

    # Should get a Pundit error since revokable? returns false
    assert_not_nil gql_errors(result)
  end

  test "unauthenticated user cannot award" do
    result = execute_query(
      mutation: AWARD_MUTATION,
      variables: {
        studentId: students(:student_emma).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s,
        behaviorCategoryId: behavior_categories(:helping_others).id.to_s
      }
    )
    assert_not_nil gql_errors(result)
  end
end
