# frozen_string_literal: true

module Types
  class FeedPostType < Types::BaseObject
    field :id, ID, null: false
    field :body, String, null: false
    field :teacher, Types::TeacherType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :media_urls, [ String ], null: false
    field :media_attachments, [ Types::MediaAttachmentType ], null: false
    field :tagged_students, [ Types::StudentType ], null: false
    field :likes_count, Integer, null: false
    field :comments_count, Integer, null: false
    field :liked_by_me, Boolean, null: false
    field :comments, [ Types::FeedPostCommentType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def tagged_students
      object.tagged_students
    end

    def media_urls
      object.media.map do |attachment|
        Rails.application.routes.url_helpers.rails_blob_url(attachment)
      end
    end

    def media_attachments
      object.media.map do |attachment|
        {
          url: Rails.application.routes.url_helpers.rails_blob_url(attachment),
          filename: attachment.filename.to_s,
          content_type: attachment.content_type
        }
      end
    end

    def liked_by_me
      return false unless context[:current_user]
      object.likes.exists?(liker: context[:current_user])
    end

    def comments
      object.comments.order(created_at: :asc).includes(:commenter)
    end
  end
end
