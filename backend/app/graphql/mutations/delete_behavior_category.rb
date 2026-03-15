module Mutations
  class DeleteBehaviorCategory < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!

      category = BehaviorCategory.find(id)
      raise Pundit::NotAuthorizedError unless BehaviorCategoryPolicy.new(current_user, category).destroy?

      category.soft_delete!
      { success: true, errors: [] }
    rescue => e
      { success: false, errors: [ { message: e.message, path: [ "id" ] } ] }
    end
  end
end
