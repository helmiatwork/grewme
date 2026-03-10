# frozen_string_literal: true

module Mutations
  class UpdateSchoolProfile < BaseMutation
    argument :phone, String, required: false
    argument :email, String, required: false
    argument :website, String, required: false

    field :school, Types::SchoolType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(phone: nil, email: nil, website: nil)
      authenticate!

      unless current_user.school_manager?
        raise GraphQL::ExecutionError, "Only school managers can update school profile"
      end

      school = current_user.school
      school.phone = phone if phone
      school.email = email if email
      school.website = website if website

      if school.save
        AuditLogger.log(
          event_type: :SCHOOL_SETTINGS_UPDATE,
          action: "update_school_profile",
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
