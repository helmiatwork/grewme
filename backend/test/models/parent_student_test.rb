require "test_helper"

class ParentStudentTest < ActiveSupport::TestCase
  test "validates uniqueness of parent-student pair" do
    duplicate = ParentStudent.new(parent: users(:parent_carol), student: students(:student_emma))
    assert_not duplicate.valid?
  end

  test "belongs to parent" do
    assert_equal users(:parent_carol), parent_students(:carol_emma).parent
  end

  test "belongs to student" do
    assert_equal students(:student_emma), parent_students(:carol_emma).student
  end
end
