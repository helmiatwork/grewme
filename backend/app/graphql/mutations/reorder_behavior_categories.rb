module Mutations
  class ReorderBehaviorCategories < BaseMutation
    argument :category_ids, [ ID ], required: true

    field :behavior_categories, [ Types::BehaviorCategoryType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(category_ids:)
      authenticate!

      categories = BehaviorCategory.where(id: category_ids)
      raise Pundit::NotAuthorizedError unless categories.all? { |c| BehaviorCategoryPolicy.new(current_user, c).reorder? }

      category_ids.each_with_index do |id, index|
        BehaviorCategory.where(id: id).update_all(position: index)
      end

      { behavior_categories: BehaviorCategory.where(id: category_ids).order(:position), errors: [] }
    end
  end
end
