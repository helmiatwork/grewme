# frozen_string_literal: true

module Mutations
  class RequestChildDataDeletion < BaseMutation
    argument :student_id, ID, required: true

    field :success, Boolean
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:)
      authenticate!
      unless current_user.parent?
        raise GraphQL::ExecutionError, "Only parents can request child data deletion"
      end

      student = Student.find(student_id)
      unless current_user.children.include?(student)
        raise GraphQL::ExecutionError, "You do not have access to this student's data"
      end

      # Delete child's learning data (not the student record itself — that's the school's)
      student.daily_scores.destroy_all
      student.exam_submissions.destroy_all
      student.objective_masteries.destroy_all

      # Revoke consent
      Consent.where(student: student, parent: current_user).find_each(&:revoke!)

      AuditLogger.log(
        event_type: :ACCOUNT_DELETION_REQUESTED,
        action: "request_child_data_deletion",
        user: current_user,
        resource: student,
        metadata: { deleted: %w[daily_scores exam_submissions objective_masteries] },
        request: context[:request]
      )

      { success: true, errors: [] }
    end
  end
end
