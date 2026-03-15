module Mutations
  class CreateBehaviorCategory < BaseMutation
    argument :school_id, ID, required: true
    argument :name, String, required: true
    argument :description, String, required: false
    argument :point_value, Integer, required: true
    argument :icon, String, required: true
    argument :color, String, required: true

    field :behavior_category, Types::BehaviorCategoryType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(school_id:, name:, point_value:, icon:, color:, description: nil)
      authenticate!

      school = School.find(school_id)
      category = school.behavior_categories.build(
        name: name,
        description: description,
        point_value: point_value,
        icon: icon,
        color: color,
        position: school.behavior_categories.active.count
      )

      raise Pundit::NotAuthorizedError unless BehaviorCategoryPolicy.new(current_user, category).create?

      if category.save
        { behavior_category: category, errors: [] }
      else
        { behavior_category: nil, errors: category.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
