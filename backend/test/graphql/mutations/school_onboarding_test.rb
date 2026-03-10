# frozen_string_literal: true

require "test_helper"

class SchoolOnboardingTest < ActiveSupport::TestCase
  REGISTER_SCHOOL_MANAGER = <<~GRAPHQL
    mutation(
      $name: String!, $email: String!, $password: String!, $passwordConfirmation: String!,
      $schoolName: String!, $minGrade: Int!, $maxGrade: Int!,
      $addressLine1: String!, $city: String!, $stateProvince: String!,
      $postalCode: String!, $countryCode: String!
    ) {
      registerSchoolManager(
        name: $name, email: $email, password: $password, passwordConfirmation: $passwordConfirmation,
        schoolName: $schoolName, minGrade: $minGrade, maxGrade: $maxGrade,
        addressLine1: $addressLine1, city: $city, stateProvince: $stateProvince,
        postalCode: $postalCode, countryCode: $countryCode
      ) {
        accessToken refreshToken expiresIn
        user { ... on SchoolManager { id name role } }
        school { id name minGrade maxGrade }
        errors { message path }
      }
    }
  GRAPHQL

  UPDATE_SCHOOL_PROFILE = <<~GRAPHQL
    mutation($phone: String, $email: String, $website: String) {
      updateSchoolProfile(phone: $phone, email: $email, website: $website) {
        school { id phone email website }
        errors { message path }
      }
    }
  GRAPHQL

  COMPLETE_ONBOARDING = <<~GRAPHQL
    mutation {
      completeOnboarding {
        school { id onboardingCompletedAt }
        errors { message path }
      }
    }
  GRAPHQL

  ONBOARDING_STATUS = <<~GRAPHQL
    query {
      schoolOnboardingStatus
    }
  GRAPHQL

  # ── RegisterSchoolManager ──────────────────────────────────────────────────

  test "registers school manager and creates school atomically" do
    result = execute_query(
      mutation: REGISTER_SCHOOL_MANAGER,
      variables: {
        name: "Jane Admin",
        email: "jane@newschool.test",
        password: "password123",
        passwordConfirmation: "password123",
        schoolName: "New School",
        minGrade: 1,
        maxGrade: 6,
        addressLine1: "456 Main St",
        city: "Seattle",
        stateProvince: "Washington",
        postalCode: "98101",
        countryCode: "US"
      }
    )

    data = gql_data(result)["registerSchoolManager"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_not_nil data["refreshToken"]
    assert_not_nil data["expiresIn"]
    assert_equal "Jane Admin", data["user"]["name"]
    assert_equal "school_manager", data["user"]["role"]
    assert_equal "New School", data["school"]["name"]
    assert_equal 1, data["school"]["minGrade"]
    assert_equal 6, data["school"]["maxGrade"]
  end

  test "registerSchoolManager rejects mismatched passwords" do
    result = execute_query(
      mutation: REGISTER_SCHOOL_MANAGER,
      variables: {
        name: "Jane Admin",
        email: "jane2@newschool.test",
        password: "password123",
        passwordConfirmation: "wrong",
        schoolName: "Bad School",
        minGrade: 1,
        maxGrade: 6,
        addressLine1: "456 Main St",
        city: "Seattle",
        stateProvince: "Washington",
        postalCode: "98101",
        countryCode: "US"
      }
    )

    data = gql_data(result)["registerSchoolManager"]
    assert_not_empty data["errors"]
  end

  test "registerSchoolManager rejects duplicate email" do
    # First registration
    execute_query(
      mutation: REGISTER_SCHOOL_MANAGER,
      variables: {
        name: "First Manager",
        email: "dup@school.test",
        password: "password123",
        passwordConfirmation: "password123",
        schoolName: "First School",
        minGrade: 1,
        maxGrade: 6,
        addressLine1: "123 St",
        city: "Portland",
        stateProvince: "Oregon",
        postalCode: "97201",
        countryCode: "US"
      }
    )

    # Duplicate email
    result = execute_query(
      mutation: REGISTER_SCHOOL_MANAGER,
      variables: {
        name: "Second Manager",
        email: "dup@school.test",
        password: "password123",
        passwordConfirmation: "password123",
        schoolName: "Second School",
        minGrade: 1,
        maxGrade: 6,
        addressLine1: "456 St",
        city: "Portland",
        stateProvince: "Oregon",
        postalCode: "97201",
        countryCode: "US"
      }
    )

    data = gql_data(result)["registerSchoolManager"]
    assert_not_empty data["errors"]
  end

  # ── UpdateSchoolProfile ────────────────────────────────────────────────────

  test "school manager can update school profile" do
    manager = school_managers(:manager_pat)

    result = execute_query(
      mutation: UPDATE_SCHOOL_PROFILE,
      variables: { phone: "+1-555-0100", email: "info@greenwood.test", website: "https://greenwood.test" },
      user: manager
    )

    data = gql_data(result)["updateSchoolProfile"]
    assert_empty data["errors"]
    assert_equal "+1-555-0100", data["school"]["phone"]
    assert_equal "info@greenwood.test", data["school"]["email"]
    assert_equal "https://greenwood.test", data["school"]["website"]
  end

  test "updateSchoolProfile rejects non-school-manager" do
    teacher = teachers(:teacher_alice)

    result = execute_query(
      mutation: UPDATE_SCHOOL_PROFILE,
      variables: { phone: "+1-555-0100" },
      user: teacher
    )

    errors = gql_errors(result)
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("school managers") }
  end

  test "updateSchoolProfile rejects unauthenticated request" do
    result = execute_query(
      mutation: UPDATE_SCHOOL_PROFILE,
      variables: { phone: "+1-555-0100" }
    )

    errors = gql_errors(result)
    assert_not_nil errors
  end

  # ── CompleteOnboarding ─────────────────────────────────────────────────────

  test "school manager can complete onboarding" do
    manager = school_managers(:manager_pat)

    result = execute_query(
      mutation: COMPLETE_ONBOARDING,
      user: manager
    )

    data = gql_data(result)["completeOnboarding"]
    assert_empty data["errors"]
    assert_not_nil data["school"]["onboardingCompletedAt"]

    manager.school.reload
    assert_not_nil manager.school.onboarding_completed_at
  end

  test "completeOnboarding rejects non-school-manager" do
    teacher = teachers(:teacher_alice)

    result = execute_query(
      mutation: COMPLETE_ONBOARDING,
      user: teacher
    )

    errors = gql_errors(result)
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("school managers") }
  end

  # ── SchoolOnboardingStatus query ───────────────────────────────────────────

  test "school manager can view onboarding status" do
    manager = school_managers(:manager_pat)

    result = execute_query(
      query: ONBOARDING_STATUS,
      user: manager
    )

    status = gql_data(result)["schoolOnboardingStatus"]
    assert_not_nil status
    # GraphQL::Types::JSON preserves Ruby symbol keys
    assert_includes status.keys, :profileComplete
    assert_includes status.keys, :academicYearComplete
    assert_includes status.keys, :subjectsComplete
    assert_includes status.keys, :classroomsComplete
    assert_includes status.keys, :teachersInvited
    assert_includes status.keys, :leaveSettingsConfigured
  end

  test "onboarding status rejects non-school-manager" do
    teacher = teachers(:teacher_alice)

    result = execute_query(
      query: ONBOARDING_STATUS,
      user: teacher
    )

    errors = gql_errors(result)
    assert_not_nil errors
    assert errors.any? { |e| e["message"].include?("school managers") }
  end

  test "onboarding status rejects unauthenticated user" do
    result = execute_query(query: ONBOARDING_STATUS)

    errors = gql_errors(result)
    assert_not_nil errors
  end
end
