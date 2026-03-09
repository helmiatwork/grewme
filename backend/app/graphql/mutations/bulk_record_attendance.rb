# frozen_string_literal: true

module Mutations
  class BulkRecordAttendance < BaseMutation
    argument :classroom_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :records, [ Types::AttendanceRecordInputType ], required: true

    field :attendances, [ Types::AttendanceType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:, date:, records:)
      authenticate!

      classroom = Classroom.find(classroom_id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?

      created = []
      all_errors = []

      records.each do |record_input|
        student = Student.find(record_input.student_id)
        raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

        attendance = Attendance.find_or_initialize_by(
          student_id: record_input.student_id,
          classroom_id: classroom_id,
          date: date
        )
        attendance.status = record_input.status
        attendance.notes = record_input.notes
        attendance.recorded_by = current_user

        raise Pundit::NotAuthorizedError unless AttendancePolicy.new(current_user, attendance).create?

        if attendance.save
          created << attendance
        else
          attendance.errors.each do |e|
            all_errors << { message: "#{student.name}: #{e.full_message}", path: [ record_input.student_id ] }
          end
        end
      end

      AuditLogger.log(
        event_type: :ATTENDANCE_BULK_RECORD,
        action: "bulk_record_attendance",
        user: current_user,
        resource: classroom,
        request: context[:request]
      )

      { attendances: created, errors: all_errors }
    end
  end
end
