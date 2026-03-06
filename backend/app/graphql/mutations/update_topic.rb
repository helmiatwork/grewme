# frozen_string_literal: true

module Mutations
  class UpdateTopic < BaseMutation
    argument :input, Types::UpdateTopicInputType, required: true

    field :topic, Types::TopicType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      topic = Topic.find(input.id)
      raise Pundit::NotAuthorizedError unless TopicPolicy.new(current_user, topic).update?

      if topic.update(input.to_h.except(:id))
        { topic: topic, errors: [] }
      else
        { topic: nil, errors: topic.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
