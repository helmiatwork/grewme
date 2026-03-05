# frozen_string_literal: true

module Mutations
  class DeleteFeedComment < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      authenticate!
      comment = FeedPostComment.find(id)
      raise Pundit::NotAuthorizedError unless comment.commenter == current_user

      comment.destroy!
      { success: true }
    end
  end
end
