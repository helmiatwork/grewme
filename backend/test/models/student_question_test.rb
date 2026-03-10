require "test_helper"

class StudentQuestionTest < ActiveSupport::TestCase
  test "validates uniqueness of exam_question per student per classroom_exam" do
    existing = student_questions(:emma_q1)
    dup = StudentQuestion.new(
      exam_question: existing.exam_question,
      student: existing.student,
      classroom_exam: existing.classroom_exam,
      values: { "a" => 5, "b" => 3 },
      generated_text: "What is 5 + 3?",
      correct_answer: "8"
    )
    assert_not dup.valid?
  end

  test "belongs to exam_question" do
    sq = student_questions(:emma_q1)
    assert_kind_of ExamQuestion, sq.exam_question
  end

  test "belongs to student" do
    sq = student_questions(:emma_q1)
    assert_kind_of Student, sq.student
  end

  test "belongs to classroom_exam" do
    sq = student_questions(:emma_q1)
    assert_kind_of ClassroomExam, sq.classroom_exam
  end

  test "validates generated_text presence" do
    sq = StudentQuestion.new(correct_answer: "8")
    assert_not sq.valid?
    assert_includes sq.errors[:generated_text], "can't be blank"
  end

  test "validates correct_answer presence" do
    sq = StudentQuestion.new(generated_text: "What is 5 + 3?")
    assert_not sq.valid?
    assert_includes sq.errors[:correct_answer], "can't be blank"
  end
end
