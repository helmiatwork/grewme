require "test_helper"

class ExamAutoSubmitJobTest < ActiveSupport::TestCase
  test "auto-submits in-progress submission" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(duration_minutes: 30)
    sub = ExamSubmission.create!(
      student: students(:student_finn),
      classroom_exam: ce,
      status: :in_progress,
      started_at: 35.minutes.ago
    )

    ExamAutoSubmitJob.perform_now(sub.id)

    sub.reload
    assert_equal "submitted", sub.status
    assert sub.auto_submitted
    assert_not_nil sub.submitted_at
  end

  test "skips already-submitted submission" do
    sub = exam_submissions(:emma_fractions_quiz)
    original_submitted_at = sub.submitted_at

    ExamAutoSubmitJob.perform_now(sub.id)

    sub.reload
    assert_equal original_submitted_at.to_i, sub.submitted_at.to_i
    assert_not sub.auto_submitted
  end

  test "skips if submission not found" do
    assert_nothing_raised { ExamAutoSubmitJob.perform_now(-1) }
  end
end
