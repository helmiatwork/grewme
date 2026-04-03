require "test_helper"

class StudentRadarSummaryTest < ActiveSupport::TestCase
  test "is read-only" do
    summary = StudentRadarSummary.new
    assert summary.readonly?
  end

  test "primary key is student_id" do
    assert_equal :student_id, StudentRadarSummary.primary_key.to_sym
  end

  test "belongs to student" do
    assoc = StudentRadarSummary.reflect_on_association(:student)
    assert_not_nil assoc
    assert_equal :belongs_to, assoc.macro
  end
end
