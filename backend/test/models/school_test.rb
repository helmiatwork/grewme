require "test_helper"

class SchoolTest < ActiveSupport::TestCase
  test "validates name presence" do
    school = School.new(name: nil)
    assert_not school.valid?
    assert_includes school.errors[:name], "can't be blank"
  end

  test "has many classrooms" do
    school = schools(:greenwood)
    assert_includes school.classrooms, classrooms(:alice_class)
    assert_includes school.classrooms, classrooms(:bob_class)
  end
end
