# frozen_string_literal: true

module Mutations
  class DeleteFeedPost < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!
      post = FeedPost.find(id)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).destroy?

      post.destroy!
      { success: true, errors: [] }
    end
  end
end
