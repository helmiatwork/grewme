class ExamAutoSubmitJob < ApplicationJob
  queue_as :default

  def perform(exam_submission_id)
    submission = ExamSubmission.find_by(id: exam_submission_id)
    return unless submission
    return unless submission.in_progress?

    submission.update!(
      status: :submitted,
      auto_submitted: true,
      submitted_at: Time.current
    )
  end
end
