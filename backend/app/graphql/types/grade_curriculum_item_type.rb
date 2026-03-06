# frozen_string_literal: true

module Types
  class GradeCurriculumItemType < Types::BaseObject
    field :id, ID, null: false
    field :subject, Types::SubjectType
    field :topic, Types::TopicType
    field :position, Integer, null: false
    field :display_name, String, null: false
  end
end
