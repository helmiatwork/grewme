# frozen_string_literal: true

module Mutations
  class CreateAcademicYear < BaseMutation
    argument :input, Types::CreateAcademicYearInputType, required: true

    field :academic_year, Types::AcademicYearType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, AcademicYear.new).create?

      attrs = input.to_h
      set_current = attrs.delete(:current)
      year = AcademicYear.new(attrs)

      if year.save
        year.set_as_current! if set_current
        { academic_year: year, errors: [] }
      else
        { academic_year: nil, errors: year.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
