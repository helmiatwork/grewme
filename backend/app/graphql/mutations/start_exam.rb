# frozen_string_literal: true

module Mutations
  class StartExam < BaseMutation
    argument :input, Types::StartExamInputType, required: true

    field :exam_submission, Types::ExamSubmissionType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      access_code = input.access_code
      student_id = input.student_id
      classroom_exam = ClassroomExam.where(status: :active).find_by(access_code: access_code.upcase.strip)
      unless classroom_exam
        return { exam_submission: nil, errors: [ { message: "Invalid or expired exam code", path: [ "accessCode" ] } ] }
      end

      student = classroom_exam.classroom.students.find_by(id: student_id)
      unless student
        return { exam_submission: nil, errors: [ { message: "Student not found in this classroom", path: [ "studentId" ] } ] }
      end

      existing = ExamSubmission.find_by(student: student, classroom_exam: classroom_exam)

      if existing
        if existing.in_progress?
          return { exam_submission: existing, errors: [] }
        else
          return { exam_submission: nil, errors: [ { message: "You have already submitted this exam", path: [ "studentId" ] } ] }
        end
      end

      submission = ExamSubmission.create!(
        student: student,
        classroom_exam: classroom_exam,
        status: :in_progress,
        started_at: Time.current
      )

      if classroom_exam.duration_minutes
        ExamAutoSubmitJob.set(wait: classroom_exam.duration_minutes.minutes).perform_later(submission.id)
      end

      { exam_submission: submission, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam_submission: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [ err.attribute.to_s.camelize(:lower) ] } } }
    end
  end
end
