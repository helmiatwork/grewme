# frozen_string_literal: true

module Types
  class MediaAttachmentType < Types::BaseObject
    field :url, String, null: false
    field :filename, String, null: false
    field :content_type, String, null: false
  end
end
