# frozen_string_literal: true

module Mutations
  class LikeFeedPost < BaseMutation
    argument :id, ID, required: true

    field :feed_post, Types::FeedPostType, null: false

    def resolve(id:)
      authenticate!
      post = FeedPost.find(id)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).like?

      existing = post.likes.find_by(liker: current_user)
      if existing
        existing.destroy!
      else
        post.likes.create!(liker: current_user)
      end

      { feed_post: post.reload }
    end
  end
end
