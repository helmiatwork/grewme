# frozen_string_literal: true

module Mutations
  class ReviewLeaveRequest < BaseMutation
    argument :leave_request_id, ID, required: true
    argument :decision, Types::LeaveRequestStatusEnum, required: true
    argument :rejection_reason, String, required: false

    field :leave_request, Types::LeaveRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(leave_request_id:, decision:, rejection_reason: nil)
      authenticate!

      leave_request = LeaveRequest.find(leave_request_id)
      raise Pundit::NotAuthorizedError unless LeaveRequestPolicy.new(current_user, leave_request).review?

      unless leave_request.pending?
        return {
          leave_request: nil,
          errors: [ { message: "Leave request has already been reviewed", path: [ "leaveRequestId" ] } ]
        }
      end

      leave_request.status = decision
      leave_request.reviewed_by = current_user
      leave_request.reviewed_at = Time.current
      leave_request.rejection_reason = rejection_reason if decision == "rejected"

      if leave_request.save
        # If approved, create attendance records for each day in range
        if leave_request.approved?
          attendance_status = leave_request.sick? ? :sick : :excused
          classroom_ids = leave_request.student.classroom_students.current.pluck(:classroom_id)

          leave_request.date_range.each do |date|
            classroom_ids.each do |classroom_id|
              Attendance.find_or_initialize_by(
                student_id: leave_request.student_id,
                classroom_id: classroom_id,
                date: date
              ).update!(
                status: attendance_status,
                recorded_by: current_user,
                leave_request: leave_request,
                notes: "Auto-created from leave request ##{leave_request.id}"
              )
            end
          end
        end

        # Notify parent
        Notification.create!(
          recipient: leave_request.parent,
          notifiable: leave_request,
          title: "Leave Request #{decision.capitalize}",
          body: "Your #{leave_request.request_type} leave request for #{leave_request.student.name} (#{leave_request.start_date} - #{leave_request.end_date}) has been #{decision}."
        )

        AuditLogger.log(
          event_type: :LEAVE_REQUEST_REVIEW,
          action: "review_leave_request",
          user: current_user,
          resource: leave_request,
          request: context[:request]
        )

        { leave_request: leave_request, errors: [] }
      else
        {
          leave_request: nil,
          errors: leave_request.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
