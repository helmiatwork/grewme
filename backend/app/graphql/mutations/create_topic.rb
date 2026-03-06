# frozen_string_literal: true

module Mutations
  class CreateTopic < BaseMutation
    argument :input, Types::CreateTopicInputType, required: true

    field :topic, Types::TopicType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless TopicPolicy.new(current_user, Topic.new).create?

      topic = Topic.new(input.to_h)
      if topic.save
        { topic: topic, errors: [] }
      else
        { topic: nil, errors: topic.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
