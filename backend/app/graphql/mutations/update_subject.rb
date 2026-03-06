# frozen_string_literal: true

module Mutations
  class UpdateSubject < BaseMutation
    argument :input, Types::UpdateSubjectInputType, required: true

    field :subject, Types::SubjectType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      subject = Subject.find(input.id)
      raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, subject).update?

      if subject.update(input.to_h.except(:id))
        { subject: subject, errors: [] }
      else
        { subject: nil, errors: subject.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
