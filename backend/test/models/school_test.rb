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

  test "validates country_code format" do
    school = School.new(name: "Test School", country_code: "XX")
    assert_not school.valid?
    assert_includes school.errors[:country_code], "is not a valid ISO 3166-1 alpha-2 code"
  end

  test "accepts valid country_code" do
    school = School.new(name: "Test School", country_code: "US")
    assert school.valid?
  end

  test "allows blank country_code" do
    school = School.new(name: "Test School", country_code: nil)
    assert school.valid?
  end

  test "full_address returns formatted address" do
    school = schools(:greenwood)
    assert_includes school.full_address, "123 Oak Street"
    assert_includes school.full_address, "Portland"
  end

  test "country_name returns country name from code" do
    school = schools(:greenwood)
    assert_equal "United States", school.country_name
  end
end
