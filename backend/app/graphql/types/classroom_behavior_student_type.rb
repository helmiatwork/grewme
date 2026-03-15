module Types
  class ClassroomBehaviorStudentType < Types::BaseObject
    field :student, Types::StudentType, null: false
    field :total_points, Integer, null: false
    field :positive_count, Integer, null: false
    field :negative_count, Integer, null: false
    field :recent_points, [ Types::BehaviorPointType ], null: false
  end
end
