# frozen_string_literal: true

module Mutations
  class CommentOnFeedPost < BaseMutation
    argument :id, ID, required: true
    argument :body, String, required: true

    field :comment, Types::FeedPostCommentType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:, body:)
      authenticate!
      post = FeedPost.find(id)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).comment?

      comment = post.comments.build(commenter: current_user, body: body)
      if comment.save
        { comment: comment, errors: [] }
      else
        { comment: nil, errors: comment.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
