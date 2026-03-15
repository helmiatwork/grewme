module Types
  class BehaviorPointType < Types::BaseObject
    field :id, ID, null: false
    field :point_value, Integer, null: false
    field :note, String
    field :awarded_at, GraphQL::Types::ISO8601DateTime, null: false
    field :revoked_at, GraphQL::Types::ISO8601DateTime
    field :revokable, Boolean, null: false
    field :student, Types::StudentType, null: false
    field :teacher, Types::TeacherType, null: false
    field :behavior_category, Types::BehaviorCategoryType, null: false

    def revokable
      object.revokable?
    end
  end
end
