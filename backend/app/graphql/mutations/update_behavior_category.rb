module Mutations
  class UpdateBehaviorCategory < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :point_value, Integer, required: false
    argument :icon, String, required: false
    argument :color, String, required: false

    field :behavior_category, Types::BehaviorCategoryType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, **attrs)
      authenticate!

      category = BehaviorCategory.find(id)
      raise Pundit::NotAuthorizedError unless BehaviorCategoryPolicy.new(current_user, category).update?

      if category.update(attrs.compact)
        { behavior_category: category, errors: [] }
      else
        { behavior_category: nil, errors: category.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
