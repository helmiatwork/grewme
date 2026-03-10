# frozen_string_literal: true

module Mutations
  class CreateTeacherLeaveRequest < BaseMutation
    argument :request_type, Types::TeacherLeaveRequestTypeEnum, required: true
    argument :start_date, GraphQL::Types::ISO8601Date, required: true
    argument :end_date, GraphQL::Types::ISO8601Date, required: true
    argument :reason, String, required: true
    argument :half_day_session, Types::HalfDaySessionEnum, required: false

    field :teacher_leave_request, Types::TeacherLeaveRequestType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(request_type:, start_date:, end_date:, reason:, half_day_session: nil)
      authenticate!

      unless current_user.teacher?
        raise GraphQL::ExecutionError, "Only teachers can create leave requests"
      end

      unless current_user.school_id
        raise GraphQL::ExecutionError, "Teacher must belong to a school"
      end

      leave_request = TeacherLeaveRequest.new(
        teacher: current_user,
        school_id: current_user.school_id,
        request_type: request_type,
        start_date: start_date,
        end_date: end_date,
        reason: reason,
        half_day_session: half_day_session
      )

      if leave_request.save
        AuditLogger.log(
          event_type: :TEACHER_LEAVE_REQUEST_CREATE,
          action: "create_teacher_leave_request",
          user: current_user,
          resource: leave_request,
          request: context[:request]
        )

        # Notify school managers
        current_user.school.school_managers.each do |manager|
          Notification.create!(
            recipient: manager,
            notifiable: leave_request,
            title: "New Teacher Leave Request",
            body: "#{current_user.name} requested #{request_type}#{" half-day (#{half_day_session})" if half_day_session} leave (#{start_date}#{" - #{end_date}" unless start_date == end_date})",
            kind: "teacher_leave_request_created",
            params: { teacher_name: current_user.name, request_type: request_type, half_day_session: half_day_session, start_date: start_date.to_s, end_date: end_date.to_s }
          )
        end

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
