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

  test "upcoming scope returns future exams" do
    ce = classroom_exams(:alice_fractions_quiz)
    ce.update!(scheduled_at: 1.day.from_now)

    assert_includes ClassroomExam.upcoming, ce
  end

  test "upcoming scope excludes past exams" do
    ce = classroom_exams(:alice_fractions_quiz)
    ce.update!(scheduled_at: 1.day.ago)

    assert_not_includes ClassroomExam.upcoming, ce
  end

  test "active_exams scope returns active exams without due date" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(status: :active, due_at: nil)

    assert_includes ClassroomExam.active_exams, ce
  end

  test "active_exams scope excludes expired exams" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(status: :active, due_at: 1.day.ago)

    assert_not_includes ClassroomExam.active_exams, ce
  end

  test "active_exams scope excludes draft exams" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(status: :draft, due_at: 1.day.from_now)

    assert_not_includes ClassroomExam.active_exams, ce
  end
end
