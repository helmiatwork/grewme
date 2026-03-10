require "test_helper"

class ExamByAccessCodeQueryTest < ActiveSupport::TestCase
  QUERY = <<~GQL
    query($code: String!) {
      examByAccessCode(code: $code) {
        id
        accessCode
        durationMinutes
        exam { id title examType }
        classroom {
          id name
          students { id name }
        }
      }
    }
  GQL

  test "returns exam info and student list for valid code" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(status: :active)

    result = GrewmeSchema.execute(QUERY, variables: { code: ce.access_code })
    data = result.dig("data", "examByAccessCode")

    assert_not_nil data
    assert_equal ce.id.to_s, data["id"]
    assert_equal ce.access_code, data["accessCode"]
    assert_not_empty data.dig("classroom", "students")
  end

  test "returns null for invalid code" do
    result = GrewmeSchema.execute(QUERY, variables: { code: "XXXXXX" })
    assert_nil result.dig("data", "examByAccessCode")
  end

  test "returns null for inactive exam" do
    ce = classroom_exams(:alice_mc_exam)
    ce.update!(status: :closed)

    result = GrewmeSchema.execute(QUERY, variables: { code: ce.access_code })
    assert_nil result.dig("data", "examByAccessCode")
  end
end
