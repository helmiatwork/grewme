require "test_helper"

class HealthCheckupMutationsTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GQL
    mutation CreateHealthCheckup($studentId: ID!, $measuredAt: ISO8601Date!, $weightKg: Float, $heightCm: Float, $headCircumferenceCm: Float, $notes: String) {
      createHealthCheckup(studentId: $studentId, measuredAt: $measuredAt, weightKg: $weightKg, heightCm: $heightCm, headCircumferenceCm: $headCircumferenceCm, notes: $notes) {
        healthCheckup { id measuredAt weightKg heightCm headCircumferenceCm bmi bmiCategory notes }
        errors { message path }
      }
    }
  GQL

  QUERY = <<~GQL
    query StudentHealthCheckups($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
      studentHealthCheckups(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
        id measuredAt weightKg heightCm bmi bmiCategory
      }
    }
  GQL

  setup do
    @teacher = teachers(:teacher_alice)
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
  end

  test "teacher creates health checkup" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      "studentId" => @student.id.to_s,
      "measuredAt" => "2026-03-15",
      "weightKg" => 20.5,
      "heightCm" => 115.0,
      "headCircumferenceCm" => 51.0,
      "notes" => "Healthy"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "createHealthCheckup")
    assert_empty data["errors"]
    assert_not_nil data["healthCheckup"]["id"]
    assert_equal 20.5, data["healthCheckup"]["weightKg"]
    assert_not_nil data["healthCheckup"]["bmi"]
  end

  test "parent cannot create health checkup" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      "studentId" => @student.id.to_s,
      "measuredAt" => "2026-03-15",
      "weightKg" => 20.5
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("Only teachers") }
  end

  test "unauthenticated user cannot create" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      "studentId" => @student.id.to_s,
      "measuredAt" => "2026-03-15",
      "weightKg" => 20.5
    }, context: { current_user: nil, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("Authentication required") }
  end

  test "requires at least one measurement" do
    result = GrewmeSchema.execute(CREATE_MUTATION, variables: {
      "studentId" => @student.id.to_s,
      "measuredAt" => "2026-03-15"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "createHealthCheckup")
    assert data["errors"].any? { |e| e["message"].include?("At least one measurement") }
  end

  test "teacher queries student health checkups" do
    result = GrewmeSchema.execute(QUERY, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    checkups = result.dig("data", "studentHealthCheckups")
    assert checkups.length >= 2  # from fixtures
    assert checkups.first["measuredAt"] >= checkups.last["measuredAt"]  # ordered desc
  end

  test "parent with consent queries health checkups" do
    Consent.create!(
      student: @student,
      parent: @parent,
      parent_email: @parent.email,
      consent_method: "email_plus",
      status: :granted,
      granted_at: Time.current
    )

    result = GrewmeSchema.execute(QUERY, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    checkups = result.dig("data", "studentHealthCheckups")
    assert_not_nil checkups
    assert checkups.length >= 2
  end

  test "parent without consent is denied" do
    result = GrewmeSchema.execute(QUERY, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("consent") || e["message"].include?("authorized") }
  end

  test "date range filtering works" do
    result = GrewmeSchema.execute(QUERY, variables: {
      "studentId" => @student.id.to_s,
      "startDate" => "2026-02-01",
      "endDate" => "2026-02-28"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    checkups = result.dig("data", "studentHealthCheckups")
    assert checkups.all? { |c| c["measuredAt"] >= "2026-02-01" && c["measuredAt"] <= "2026-02-28" }
  end
end
