# frozen_string_literal: true

module Types
  class QuestionTemplateType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :category, String, null: false
    field :grade_min, Integer, null: false
    field :grade_max, Integer, null: false
    field :template_text, String, null: false
    field :variables, GraphQL::Types::JSON, null: false
    field :formula, String, null: false
  end
end
