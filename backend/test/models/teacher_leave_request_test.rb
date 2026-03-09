require "test_helper"

class TeacherLeaveRequestTest < ActiveSupport::TestCase
  setup do
    @teacher = teachers(:teacher_alice)
    @school = schools(:greenwood)
  end

  test "valid teacher leave request" do
    req = TeacherLeaveRequest.new(
      teacher: @teacher,
      school: @school,
      request_type: :sick,
      start_date: Date.tomorrow,
      end_date: Date.tomorrow + 1,
      reason: "Not feeling well"
    )
    assert req.valid?, req.errors.full_messages.join(", ")
  end

  test "requires start_date" do
    req = TeacherLeaveRequest.new(teacher: @teacher, school: @school, request_type: :sick, end_date: Date.tomorrow, reason: "Sick")
    assert_not req.valid?
    assert_includes req.errors[:start_date], "can't be blank"
  end

  test "requires end_date" do
    req = TeacherLeaveRequest.new(teacher: @teacher, school: @school, request_type: :sick, start_date: Date.tomorrow, reason: "Sick")
    assert_not req.valid?
    assert_includes req.errors[:end_date], "can't be blank"
  end

  test "requires reason" do
    req = TeacherLeaveRequest.new(teacher: @teacher, school: @school, request_type: :sick, start_date: Date.tomorrow, end_date: Date.tomorrow, reason: "")
    assert_not req.valid?
    assert_includes req.errors[:reason], "can't be blank"
  end

  test "end_date must be on or after start_date" do
    req = TeacherLeaveRequest.new(teacher: @teacher, school: @school, request_type: :sick, start_date: Date.tomorrow, end_date: Date.yesterday, reason: "Sick")
    assert_not req.valid?
    assert_includes req.errors[:end_date], "must be on or after start date"
  end

  test "days_count calculation" do
    req = TeacherLeaveRequest.new(start_date: Date.new(2026, 3, 10), end_date: Date.new(2026, 3, 12))
    assert_equal 3, req.days_count
  end

  test "days_count for single day" do
    req = TeacherLeaveRequest.new(start_date: Date.new(2026, 3, 10), end_date: Date.new(2026, 3, 10))
    assert_equal 1, req.days_count
  end

  test "substitute cannot be the same teacher" do
    req = TeacherLeaveRequest.new(
      teacher: @teacher, school: @school, request_type: :annual,
      start_date: Date.tomorrow, end_date: Date.tomorrow, reason: "Vacation",
      substitute: @teacher
    )
    assert_not req.valid?
    assert_includes req.errors[:substitute], "cannot be the same teacher"
  end

  test "encrypts reason" do
    req = TeacherLeaveRequest.create!(
      teacher: @teacher, school: @school, request_type: :sick,
      start_date: Date.tomorrow, end_date: Date.tomorrow + 1, reason: "Flu symptoms"
    )
    assert_equal "Flu symptoms", req.reason
    # Raw value should be encrypted
    raw = TeacherLeaveRequest.connection.select_value(
      "SELECT reason FROM teacher_leave_requests WHERE id = #{req.id}"
    )
    assert_not_equal "Flu symptoms", raw
  end

  test "request_type enum values" do
    assert_equal({ "sick" => 0, "personal" => 1, "annual" => 2 }, TeacherLeaveRequest.request_types)
  end

  test "status enum values" do
    assert_equal({ "pending" => 0, "approved" => 1, "rejected" => 2 }, TeacherLeaveRequest.statuses)
  end

  test "default status is pending" do
    req = TeacherLeaveRequest.new
    assert req.pending?
  end
end
