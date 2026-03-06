# frozen_string_literal: true

module Types
  class GroupMessageType < Types::BaseObject
    field :id, ID, null: false
    field :body, String, null: false
    field :sender_name, String, null: false
    field :sender_type, String, null: false
    field :sender_id, ID, null: false
    field :mine, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :attachments, [ Types::MediaAttachmentType ], null: false

    def mine
      context[:current_user] && object.mine?(context[:current_user])
    end

    def attachments
      object.attachments.map do |a|
        OpenStruct.new(
          url: Rails.application.routes.url_helpers.rails_blob_url(a),
          filename: a.filename.to_s,
          content_type: a.content_type
        )
      end
    end
  end
end
