module Types
  class BehaviorSummaryType < Types::BaseObject
    field :id, ID, null: false
    field :week_start, GraphQL::Types::ISO8601Date, null: false
    field :total_points, Integer, null: false
    field :positive_count, Integer, null: false
    field :negative_count, Integer, null: false
    field :student, Types::StudentType, null: false
    field :top_behavior_category, Types::BehaviorCategoryType
  end
end
