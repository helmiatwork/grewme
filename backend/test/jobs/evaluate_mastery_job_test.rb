# frozen_string_literal: true

require "test_helper"

class EvaluateMasteryJobTest < ActiveSupport::TestCase
  test "evaluates all objectives in a topic" do
    student = students(:student_emma)
    topic = topics(:fractions)

    # Clean up existing masteries
    ObjectiveMastery.where(student: student).delete_all

    # Create a passing submission
    ExamSubmission.where(student: student, classroom_exam: classroom_exams(:alice_fractions_quiz)).delete_all
    ExamSubmission.create!(
      student: student,
      classroom_exam: classroom_exams(:alice_fractions_quiz),
      status: :graded,
      score: 90.0,
      passed: true,
      graded_at: Time.current
    )

    assert_difference "ObjectiveMastery.count", topic.learning_objectives.count do
      EvaluateMasteryJob.perform_now(student.id, topic.id)
    end
  end

  test "updates existing masteries" do
    student = students(:student_emma)
    topic = topics(:fractions)

    # Ensure mastery exists
    mastery = ObjectiveMastery.find_or_create_by!(
      student: student,
      learning_objective: learning_objectives(:add_fractions)
    )
    mastery.update!(exam_mastered: false)

    # Create passing submission
    ExamSubmission.where(student: student, classroom_exam: classroom_exams(:alice_fractions_quiz)).delete_all
    ExamSubmission.create!(
      student: student,
      classroom_exam: classroom_exams(:alice_fractions_quiz),
      status: :graded,
      score: 90.0,
      passed: true,
      graded_at: Time.current
    )

    EvaluateMasteryJob.perform_now(student.id, topic.id)

    mastery.reload
    assert mastery.exam_mastered
  end

  test "handles non-existent student gracefully" do
    assert_raises(ActiveRecord::RecordNotFound) do
      EvaluateMasteryJob.perform_now(999999, topics(:fractions).id)
    end
  end

  test "handles non-existent topic gracefully" do
    assert_raises(ActiveRecord::RecordNotFound) do
      EvaluateMasteryJob.perform_now(students(:student_emma).id, 999999)
    end
  end
end
