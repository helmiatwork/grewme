# frozen_string_literal: true

module Types
  class StudentType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :avatar, String
    field :daily_scores, Types::DailyScoreType.connection_type, null: false
    field :parents, [ Types::ParentType ], null: false

    def daily_scores
      object.daily_scores.order(date: :desc)
    end

    def parents
      object.parents
    end
  end
end
