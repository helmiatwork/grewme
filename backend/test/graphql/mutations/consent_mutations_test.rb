# frozen_string_literal: true

require "test_helper"

class ConsentMutationsTest < ActiveSupport::TestCase
  REQUEST_CONSENT_MUTATION = <<~GRAPHQL
    mutation($input: RequestConsentInput!) {
      requestConsent(input: $input) {
        consent { id status parentEmail consentMethod }
        errors { message path }
      }
    }
  GRAPHQL

  GRANT_CONSENT_MUTATION = <<~GRAPHQL
    mutation($input: GrantConsentInput!) {
      grantConsent(input: $input) {
        accessToken
        consent { id status }
        errors { message path }
      }
    }
  GRAPHQL

  DECLINE_CONSENT_MUTATION = <<~GRAPHQL
    mutation($input: DeclineConsentInput!) {
      declineConsent(input: $input) {
        consent { id status }
        errors { message path }
      }
    }
  GRAPHQL

  REVOKE_CONSENT_MUTATION = <<~GRAPHQL
    mutation($input: RevokeConsentInput!) {
      revokeConsent(input: $input) {
        consent { id status }
        errors { message path }
      }
    }
  GRAPHQL

  CONSENT_STATUS_QUERY = <<~GRAPHQL
    query {
      consentStatus {
        id status parentEmail
      }
    }
  GRAPHQL

  # === requestConsent ===

  test "teacher requests consent successfully" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)

    result = execute_query(
      mutation: REQUEST_CONSENT_MUTATION,
      variables: { input: { studentId: student.id.to_s, parentEmail: "newparent@example.com" } },
      user: teacher
    )

    data = gql_data(result)["requestConsent"]
    assert_empty data["errors"]
    assert_equal "pending", data["consent"]["status"]
    assert_equal "newparent@example.com", data["consent"]["parentEmail"]
    assert_equal "email_plus", data["consent"]["consentMethod"]
  end

  test "non-teacher cannot request consent" do
    parent = parents(:parent_carol)
    student = students(:student_emma)

    result = execute_query(
      mutation: REQUEST_CONSENT_MUTATION,
      variables: { input: { studentId: student.id.to_s, parentEmail: "test@example.com" } },
      user: parent
    )

    errors = gql_errors(result)
    assert_not_nil errors
    assert_match "Only teachers can request consent", errors.first["message"]
  end

  # === grantConsent ===

  test "grant consent with valid token creates parent and grants" do
    student = students(:student_finn)
    consent = Consent.create!(
      student: student,
      parent_email: "newmom@example.com",
      consent_method: "email_plus"
    )

    result = execute_query(
      mutation: GRANT_CONSENT_MUTATION,
      variables: {
        input: {
          token: consent.token,
          name: "New Mom",
          password: "password123",
          passwordConfirmation: "password123"
        }
      }
    )

    data = gql_data(result)["grantConsent"]
    assert_empty data["errors"]
    assert_equal "granted", data["consent"]["status"]
    assert_not_nil data["accessToken"]
  end

  test "grant consent with invalid token returns error" do
    result = execute_query(
      mutation: GRANT_CONSENT_MUTATION,
      variables: {
        input: {
          token: "invalid_token_xyz",
          name: "Test",
          password: "password123",
          passwordConfirmation: "password123"
        }
      }
    )

    data = gql_data(result)["grantConsent"]
    assert_not_empty data["errors"]
    assert_match "Invalid consent token", data["errors"].first["message"]
  end

  test "grant consent with expired consent returns error" do
    student = students(:student_finn)
    consent = Consent.create!(
      student: student,
      parent_email: "expired@example.com",
      consent_method: "email_plus"
    )
    consent.update_columns(expires_at: 1.day.ago)

    result = execute_query(
      mutation: GRANT_CONSENT_MUTATION,
      variables: {
        input: {
          token: consent.token,
          name: "Test",
          password: "password123",
          passwordConfirmation: "password123"
        }
      }
    )

    data = gql_data(result)["grantConsent"]
    assert_not_empty data["errors"]
    assert_match "expired", data["errors"].first["message"]
  end

  # === declineConsent ===

  test "decline consent with valid token" do
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "decline@example.com",
      consent_method: "email_plus"
    )

    result = execute_query(
      mutation: DECLINE_CONSENT_MUTATION,
      variables: { input: { token: consent.token } }
    )

    data = gql_data(result)["declineConsent"]
    assert_empty data["errors"]
    assert_equal "declined", data["consent"]["status"]
  end

  # === revokeConsent ===

  test "parent revokes their own consent" do
    parent = parents(:parent_carol)
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "carol@parent.test",
      consent_method: "email_plus"
    )
    consent.grant!(parent: parent, ip_address: "127.0.0.1")

    result = execute_query(
      mutation: REVOKE_CONSENT_MUTATION,
      variables: { input: { id: consent.id.to_s } },
      user: parent
    )

    data = gql_data(result)["revokeConsent"]
    assert_empty data["errors"]
    assert_equal "revoked", data["consent"]["status"]
  end

  test "non-parent cannot revoke consent" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "nope@example.com",
      consent_method: "email_plus"
    )

    result = execute_query(
      mutation: REVOKE_CONSENT_MUTATION,
      variables: { input: { id: consent.id.to_s } },
      user: teacher
    )

    errors = gql_errors(result)
    assert_not_nil errors
    assert_match "Only parents can revoke consent", errors.first["message"]
  end

  # === consentStatus query ===

  test "parent sees their consent records" do
    parent = parents(:parent_carol)
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "carol@parent.test",
      consent_method: "email_plus"
    )
    consent.grant!(parent: parent, ip_address: "127.0.0.1")

    result = execute_query(
      query: CONSENT_STATUS_QUERY,
      user: parent
    )

    data = gql_data(result)["consentStatus"]
    assert_kind_of Array, data
    assert data.any? { |c| c["id"] == consent.id.to_s }
  end

  test "teacher sees consent for their students" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)
    consent = Consent.create!(
      student: student,
      parent_email: "teacher_view@example.com",
      consent_method: "email_plus"
    )

    result = execute_query(
      query: CONSENT_STATUS_QUERY,
      user: teacher
    )

    data = gql_data(result)["consentStatus"]
    assert_kind_of Array, data
    assert data.any? { |c| c["id"] == consent.id.to_s }
  end
end
