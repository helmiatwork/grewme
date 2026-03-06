# frozen_string_literal: true

require "test_helper"

class SubjectsQueryTest < ActiveSupport::TestCase
  QUERY = <<~GQL
    query($schoolId: ID!) {
      subjects(schoolId: $schoolId) {
        id name topics { id name learningObjectives { id name examPassThreshold } }
      }
    }
  GQL

  test "returns subjects with nested topics and objectives" do
    teacher = teachers(:teacher_alice)
    result = execute_query(
      query: QUERY,
      variables: { schoolId: schools(:greenwood).id.to_s },
      user: teacher
    )

    subjects = result["data"]["subjects"]
    assert subjects.any? { |s| s["name"] == "Mathematics" }

    math = subjects.find { |s| s["name"] == "Mathematics" }
    assert math["topics"].any? { |t| t["name"] == "Fractions" }

    fractions = math["topics"].find { |t| t["name"] == "Fractions" }
    assert fractions["learningObjectives"].any? { |lo| lo["name"] == "Add fractions with different denominators" }
  end

  test "returns empty array for school with no subjects" do
    teacher = teachers(:teacher_alice)
    other_school = School.create!(name: "Empty School")
    result = execute_query(
      query: QUERY,
      variables: { schoolId: other_school.id.to_s },
      user: teacher
    )

    assert_equal [], result["data"]["subjects"]
  end
end
