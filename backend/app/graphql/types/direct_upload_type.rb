# frozen_string_literal: true

module Types
  class DirectUploadType < Types::BaseObject
    field :url, String, null: false, description: "Presigned upload URL for PUT request"
    field :headers, String, null: false, description: "JSON string of required headers for the upload"
    field :signed_blob_id, String, null: false, description: "Signed blob ID to attach after upload"
  end
end
