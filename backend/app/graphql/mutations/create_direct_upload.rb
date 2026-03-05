# frozen_string_literal: true

module Mutations
  class CreateDirectUpload < BaseMutation
    argument :filename, String, required: true
    argument :byte_size, Integer, required: true
    argument :content_type, String, required: true
    argument :checksum, String, required: true

    field :direct_upload, Types::DirectUploadType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(filename:, byte_size:, content_type:, checksum:)
      authenticate!
      raise Pundit::NotAuthorizedError unless current_user.teacher?

      blob = ActiveStorage::Blob.create_before_direct_upload!(
        filename: filename,
        byte_size: byte_size,
        content_type: content_type,
        checksum: checksum
      )

      {
        direct_upload: {
          url: blob.service_url_for_direct_upload,
          headers: blob.service_headers_for_direct_upload.to_json,
          signed_blob_id: blob.signed_id
        },
        errors: []
      }
    end
  end
end
