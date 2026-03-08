# frozen_string_literal: true

require "test_helper"

class ConsentFlowTest < ActiveSupport::TestCase
  REQUEST_CONSENT = <<~GQL
    mutation($input: RequestConsentInput!) {
      requestConsent(input: $input) {
        consent { id status }
        errors { message path }
      }
    }
  GQL

  GRANT_CONSENT = <<~GQL
    mutation($input: GrantConsentInput!) {
      grantConsent(input: $input) {
        accessToken
        user { ... on Parent { id name role } }
        consent { id status }
        errors { message path }
      }
    }
  GQL

  DECLINE_CONSENT = <<~GQL
    mutation($input: DeclineConsentInput!) {
      declineConsent(input: $input) {
        consent { id status }
        errors { message path }
      }
    }
  GQL

  REVOKE_CONSENT = <<~GQL
    mutation($input: RevokeConsentInput!) {
      revokeConsent(input: $input) {
        consent { id status }
        errors { message path }
      }
    }
  GQL

  CONSENT_STATUS = <<~GQL
    query($studentId: ID) {
      consentStatus(studentId: $studentId) {
        id studentName status
      }
    }
  GQL

  test "full consent flow: request → grant → parent linked → revoke" do
    teacher = teachers(:teacher_alice)
    student = students(:student_emma)

    # Step 1: Teacher requests consent
    result = execute_query(
      mutation: REQUEST_CONSENT,
      variables: { input: { studentId: student.id.to_s, parentEmail: "flowparent@test.com" } },
      user: teacher
    )
    data = gql_data(result)["requestConsent"]
    assert_empty data["errors"]
    consent_id = data["consent"]["id"]
    assert_equal "pending", data["consent"]["status"]
    # Fetch token from DB (not exposed via GraphQL for security)
    token = Consent.find(consent_id).token

    # Step 2: Parent grants consent (creates account)
    grant_result = execute_query(
      mutation: GRANT_CONSENT,
      variables: {
        input: {
          token: token,
          name: "Flow Parent",
          password: "password123",
          passwordConfirmation: "password123"
        }
      }
    )
    grant_data = gql_data(grant_result)["grantConsent"]
    assert_empty grant_data["errors"]
    assert_not_nil grant_data["accessToken"]
    assert_equal "Flow Parent", grant_data["user"]["name"]
    assert_equal "granted", grant_data["consent"]["status"]

    # Step 3: Verify parent is linked to student
    parent = Parent.find_by(email: "flowparent@test.com")
    assert_not_nil parent
    assert_includes parent.children, student

    # Step 4: Parent can see consent status
    status_result = execute_query(
      query: CONSENT_STATUS,
      variables: { studentId: student.id.to_s },
      user: parent
    )
    consents = gql_data(status_result)["consentStatus"]
    assert consents.any? { |c| c["status"] == "granted" }

    # Step 5: Parent revokes consent
    consent = Consent.find_by(token: token)
    revoke_result = execute_query(
      mutation: REVOKE_CONSENT,
      variables: { input: { id: consent.id.to_s } },
      user: parent
    )
    revoke_data = gql_data(revoke_result)["revokeConsent"]
    assert_empty revoke_data["errors"]
    assert_equal "revoked", revoke_data["consent"]["status"]

    # Step 6: Verify audit trail
    assert AuditLog.exists?(event_type: "CONSENT_REQUESTED")
    assert AuditLog.exists?(event_type: "CONSENT_GRANTED")
    assert AuditLog.exists?(event_type: "CONSENT_REVOKED")
  end

  test "consent decline flow" do
    teacher = teachers(:teacher_alice)
    student = students(:student_finn)

    # Teacher requests consent
    result = execute_query(
      mutation: REQUEST_CONSENT,
      variables: { input: { studentId: student.id.to_s, parentEmail: "decline@test.com" } },
      user: teacher
    )
    consent_id = gql_data(result)["requestConsent"]["consent"]["id"]
    token = Consent.find(consent_id).token

    # Parent declines
    decline_result = execute_query(
      mutation: DECLINE_CONSENT,
      variables: { input: { token: token } }
    )
    assert_equal "declined", gql_data(decline_result)["declineConsent"]["consent"]["status"]

    # Verify audit
    assert AuditLog.exists?(event_type: "CONSENT_DECLINED")
  end
end
