# frozen_string_literal: true

module Mutations
  class CreateLeaveRequest < BaseMutation
    argument :student_id, ID, required: true
    argument :request_type, Types::LeaveRequestTypeEnum, required: true
    argument :start_date, GraphQL::Types::ISO8601Date, required: true
    argument :end_date, GraphQL::Types::ISO8601Date, required: true
    argument :reason, String, required: true

    field :leave_request, Types::LeaveRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, request_type:, start_date:, end_date:, reason:)
      authenticate!

      raise Pundit::NotAuthorizedError unless LeaveRequestPolicy.new(current_user, LeaveRequest.new).create?

      leave_request = LeaveRequest.new(
        student_id: student_id,
        parent: current_user,
        request_type: request_type,
        start_date: start_date,
        end_date: end_date,
        reason: reason
      )

      if leave_request.save
        AuditLogger.log(
          event_type: :LEAVE_REQUEST_CREATE,
          action: "create_leave_request",
          user: current_user,
          resource: leave_request,
          request: context[:request]
        )

        # Notify classroom teachers
        leave_request.student.classroom_students.current.each do |cs|
          cs.classroom.teachers.each do |teacher|
            Notification.create!(
              recipient: teacher,
              notifiable: leave_request,
              title: "New Leave Request",
              body: "#{current_user.name} submitted a #{request_type} leave for #{leave_request.student.name} (#{start_date} - #{end_date})"
            )
          end
        end

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
