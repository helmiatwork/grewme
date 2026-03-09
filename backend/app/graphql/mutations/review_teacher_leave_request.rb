# frozen_string_literal: true

module Mutations
  class ReviewTeacherLeaveRequest < BaseMutation
    argument :teacher_leave_request_id, ID, required: true
    argument :decision, Types::LeaveRequestStatusEnum, required: true
    argument :rejection_reason, String, required: false
    argument :substitute_id, ID, required: false

    field :teacher_leave_request, Types::TeacherLeaveRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(teacher_leave_request_id:, decision:, rejection_reason: nil, substitute_id: nil)
      authenticate!

      leave_request = TeacherLeaveRequest.find(teacher_leave_request_id)
      raise Pundit::NotAuthorizedError unless TeacherLeaveRequestPolicy.new(current_user, leave_request).review?

      unless leave_request.pending?
        return {
          teacher_leave_request: nil,
          errors: [ { message: "Leave request has already been reviewed", path: [ "teacherLeaveRequestId" ] } ]
        }
      end

      leave_request.status = decision
      leave_request.reviewed_by = current_user
      leave_request.reviewed_at = Time.current
      leave_request.rejection_reason = rejection_reason if decision == "rejected"
      leave_request.substitute_id = substitute_id if decision == "approved" && substitute_id.present?

      if leave_request.save
        # Update leave balance on approval
        if leave_request.approved?
          academic_year = leave_request.school.academic_years.current_year.first
          if academic_year
            balance = TeacherLeaveBalance.find_or_create_for(leave_request.teacher, academic_year)
            balance.increment_usage!(leave_request.request_type, leave_request.days_count)
          end
        end

        # Notify teacher
        Notification.create!(
          recipient: leave_request.teacher,
          notifiable: leave_request,
          title: "Leave Request #{decision.capitalize}",
          body: "Your #{leave_request.request_type} leave request (#{leave_request.start_date} - #{leave_request.end_date}) has been #{decision}."
        )

        AuditLogger.log(
          event_type: :TEACHER_LEAVE_REQUEST_REVIEW,
          action: "review_teacher_leave_request",
          user: current_user,
          resource: leave_request,
          request: context[:request]
        )

        { teacher_leave_request: leave_request, errors: [] }
      else
        {
          teacher_leave_request: nil,
          errors: leave_request.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
