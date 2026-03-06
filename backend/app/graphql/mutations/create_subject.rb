# frozen_string_literal: true

module Mutations
  class CreateSubject < BaseMutation
    argument :input, Types::CreateSubjectInputType, required: true

    field :subject, Types::SubjectType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless SubjectPolicy.new(current_user, Subject.new).create?

      subject = Subject.new(input.to_h)
      if subject.save
        { subject: subject, errors: [] }
      else
        { subject: nil, errors: subject.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
