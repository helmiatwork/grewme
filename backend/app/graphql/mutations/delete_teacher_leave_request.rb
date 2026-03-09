# frozen_string_literal: true

module Mutations
  class DeleteTeacherLeaveRequest < BaseMutation
    argument :teacher_leave_request_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(teacher_leave_request_id:)
      authenticate!

      leave_request = TeacherLeaveRequest.find(teacher_leave_request_id)
      raise Pundit::NotAuthorizedError unless TeacherLeaveRequestPolicy.new(current_user, leave_request).delete?

      leave_request.destroy!

      AuditLogger.log(
        event_type: :TEACHER_LEAVE_REQUEST_DELETE,
        action: "delete_teacher_leave_request",
        user: current_user,
        resource: leave_request,
        request: context[:request]
      )

      { success: true, errors: [] }
    rescue ActiveRecord::RecordNotDestroyed => e
      { success: false, errors: [ { message: e.message, path: [ "teacherLeaveRequestId" ] } ] }
    end
  end
end
