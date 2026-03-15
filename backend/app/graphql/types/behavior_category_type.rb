module Types
  class BehaviorCategoryType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :description, String
    field :point_value, Integer, null: false
    field :is_positive, Boolean, null: false
    field :icon, String, null: false
    field :color, String, null: false
    field :position, Integer, null: false
  end
end
