# frozen_string_literal: true

module Mutations
  class UpdateSchoolLeaveSettings < BaseMutation
    argument :max_annual_leave_days, Integer, required: true
    argument :max_sick_leave_days, Integer, required: true

    field :school, Types::SchoolType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(max_annual_leave_days:, max_sick_leave_days:)
      authenticate!

      unless current_user.school_manager?
        raise GraphQL::ExecutionError, "Only school managers can update leave settings"
      end

      school = current_user.school
      school.max_annual_leave_days = max_annual_leave_days
      school.max_sick_leave_days = max_sick_leave_days

      if school.save
        AuditLogger.log(
          event_type: :SCHOOL_SETTINGS_UPDATE,
          action: "update_school_leave_settings",
          user: current_user,
          resource: school,
          request: context[:request]
        )
        { school: school, errors: [] }
      else
        {
          school: nil,
          errors: school.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
