# frozen_string_literal: true

require "test_helper"

class DirectUploadMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation CreateDirectUpload($filename: String!, $byteSize: Int!, $contentType: String!, $checksum: String!) {
      createDirectUpload(filename: $filename, byteSize: $byteSize, contentType: $contentType, checksum: $checksum) {
        directUpload { url headers signedBlobId }
        errors { message path }
      }
    }
  GQL

  DEFAULT_VARS = {
    filename: "photo.jpg",
    byteSize: 1024,
    contentType: "image/jpeg",
    checksum: Base64.strict_encode64(Digest::MD5.digest("test"))
  }.freeze

  setup do
    Rails.application.routes.default_url_options[:host] = "example.com"
  end

  test "teacher can create direct upload" do
    result = execute_query(
      mutation: MUTATION,
      variables: DEFAULT_VARS,
      user: teachers(:teacher_alice)
    )

    upload = result.dig("data", "createDirectUpload", "directUpload")
    assert upload["url"].present?
    assert upload["signedBlobId"].present?
    assert JSON.parse(upload["headers"]).is_a?(Hash)
    assert_empty result.dig("data", "createDirectUpload", "errors")
  end

  test "parent cannot create direct upload" do
    result = execute_query(
      mutation: MUTATION,
      variables: DEFAULT_VARS,
      user: parents(:parent_carol)
    )

    assert_not_nil gql_errors(result)
    assert_match "Not authorized", gql_errors(result).first["message"]
  end

  test "unauthenticated user cannot create direct upload" do
    result = execute_query(
      mutation: MUTATION,
      variables: DEFAULT_VARS
    )

    assert_not_nil gql_errors(result)
    assert_match "Authentication required", gql_errors(result).first["message"]
  end
end
