# frozen_string_literal: true

module Mutations
  class UpdateAcademicYear < BaseMutation
    argument :input, Types::UpdateAcademicYearInputType, required: true

    field :academic_year, Types::AcademicYearType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      year = AcademicYear.find(input[:id])
      raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, year).update?

      attrs = input.to_h.except(:id)
      if year.update(attrs)
        { academic_year: year, errors: [] }
      else
        { academic_year: nil, errors: year.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
