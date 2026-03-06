require "test_helper"

class MasteryEvaluationServiceTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @objective = learning_objectives(:add_fractions)
    # Remove the pre-existing fixture mastery so tests start clean
    ObjectiveMastery.where(student: @student, learning_objective: @objective).delete_all
  end

  test "marks exam_mastered when submission score meets threshold" do
    ce = classroom_exams(:alice_fractions_quiz)
    # Remove existing submission fixture if any
    ExamSubmission.where(student: @student, classroom_exam: ce).delete_all
    ExamSubmission.create!(
      student: @student,
      classroom_exam: ce,
      status: :graded,
      score: 85.0,
      passed: true,
      graded_at: Time.current
    )

    mastery = MasteryEvaluationService.evaluate(@student, @objective)
    assert mastery.exam_mastered
  end

  test "does not mark exam_mastered when score below threshold" do
    ce = classroom_exams(:alice_fractions_quiz)
    ExamSubmission.where(student: @student, classroom_exam: ce).delete_all
    ExamSubmission.create!(
      student: @student,
      classroom_exam: ce,
      status: :graded,
      score: 50.0,
      passed: false,
      graded_at: Time.current
    )

    mastery = MasteryEvaluationService.evaluate(@student, @objective)
    assert_not mastery.exam_mastered
  end

  test "marks daily_mastered when daily score average meets threshold" do
    # Create daily scores that average above 75 (the threshold)
    DailyScore.create!(student: @student, teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :reading, score: 80)
    DailyScore.create!(student: @student, teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 10), skill_category: :math, score: 90)

    mastery = MasteryEvaluationService.evaluate(@student, @objective)
    assert mastery.daily_mastered
  end

  test "sets mastered_at when both flags are true" do
    ce = classroom_exams(:alice_fractions_quiz)
    ExamSubmission.where(student: @student, classroom_exam: ce).delete_all
    ExamSubmission.create!(
      student: @student,
      classroom_exam: ce,
      status: :graded,
      score: 85.0,
      passed: true,
      graded_at: Time.current
    )

    # Create daily scores above threshold
    DailyScore.create!(student: @student, teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 11), skill_category: :reading, score: 80)
    DailyScore.create!(student: @student, teacher: teachers(:teacher_alice), date: Date.new(2026, 3, 11), skill_category: :math, score: 90)

    mastery = MasteryEvaluationService.evaluate(@student, @objective)
    assert mastery.mastered?
    assert_not_nil mastery.mastered_at
  end
end
