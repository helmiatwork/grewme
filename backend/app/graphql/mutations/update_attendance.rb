# frozen_string_literal: true

module Mutations
  class UpdateAttendance < BaseMutation
    argument :attendance_id, ID, required: true
    argument :status, Types::AttendanceStatusEnum, required: true
    argument :notes, String, required: false

    field :attendance, Types::AttendanceType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(attendance_id:, status:, notes: nil)
      authenticate!

      attendance = Attendance.find(attendance_id)
      raise Pundit::NotAuthorizedError unless AttendancePolicy.new(current_user, attendance).update?

      attendance.status = status
      attendance.notes = notes unless notes.nil?
      attendance.recorded_by = current_user

      if attendance.save
        AuditLogger.log(
          event_type: :ATTENDANCE_UPDATE,
          action: "update_attendance",
          user: current_user,
          resource: attendance,
          request: context[:request]
        )
        { attendance: attendance, errors: [] }
      else
        {
          attendance: nil,
          errors: attendance.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
