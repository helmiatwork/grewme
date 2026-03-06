# frozen_string_literal: true

module Mutations
  class SetCurrentAcademicYear < BaseMutation
    argument :id, ID, required: true

    field :academic_year, Types::AcademicYearType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      year = AcademicYear.find(id)
      raise Pundit::NotAuthorizedError unless AcademicYearPolicy.new(current_user, year).update?

      year.set_as_current!
      { academic_year: year, errors: [] }
    end
  end
end
