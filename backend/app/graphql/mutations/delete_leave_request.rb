# frozen_string_literal: true

module Mutations
  class DeleteLeaveRequest < BaseMutation
    argument :leave_request_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(leave_request_id:)
      authenticate!

      leave_request = LeaveRequest.find(leave_request_id)
      raise Pundit::NotAuthorizedError unless LeaveRequestPolicy.new(current_user, leave_request).delete?

      leave_request.destroy!

      AuditLogger.log(
        event_type: :LEAVE_REQUEST_DELETE,
        action: "delete_leave_request",
        user: current_user,
        resource: leave_request,
        request: context[:request]
      )

      { success: true, errors: [] }
    rescue ActiveRecord::RecordNotDestroyed => e
      { success: false, errors: [ { message: e.message, path: [ "leaveRequestId" ] } ] }
    end
  end
end
