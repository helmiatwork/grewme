# frozen_string_literal: true

module Mutations
  class DeleteSubject < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      subject = Subject.find(id)
      raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, subject).destroy?

      subject.destroy!
      { success: true, errors: [] }
    end
  end
end
