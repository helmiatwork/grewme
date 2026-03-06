require "test_helper"

class ClassroomExamTest < ActiveSupport::TestCase
  test "belongs to exam and classroom" do
    ce = classroom_exams(:alice_fractions_quiz)
    assert_equal exams(:fractions_score_exam), ce.exam
    assert_equal classrooms(:alice_class), ce.classroom
  end

  test "belongs to assigned_by (polymorphic)" do
    ce = classroom_exams(:alice_fractions_quiz)
    assert_equal teachers(:teacher_alice), ce.assigned_by
  end

  test "unique exam per classroom" do
    existing = classroom_exams(:alice_fractions_quiz)
    duplicate = ClassroomExam.new(exam: existing.exam, classroom: existing.classroom, assigned_by: teachers(:teacher_alice))
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:exam_id], "has already been taken"
  end

  test "status enum" do
    assert_equal %w[draft active closed], ClassroomExam.statuses.keys
  end

  test "has many exam_submissions" do
    ce = classroom_exams(:alice_fractions_quiz)
    assert_respond_to ce, :exam_submissions
  end
end
