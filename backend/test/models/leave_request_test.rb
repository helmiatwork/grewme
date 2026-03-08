require "test_helper"

class LeaveRequestTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @parent = parents(:parent_carol)
    @teacher = teachers(:teacher_alice)
  end

  test "valid leave request" do
    lr = LeaveRequest.new(
      student: @student, parent: @parent,
      request_type: :sick,
      start_date: Date.new(2026, 4, 1),
      end_date: Date.new(2026, 4, 2),
      reason: "Flu symptoms"
    )
    assert lr.valid?, lr.errors.full_messages.join(", ")
  end

  test "requires start_date" do
    lr = LeaveRequest.new(student: @student, parent: @parent, request_type: :sick, end_date: Date.today, reason: "Sick")
    assert_not lr.valid?
    assert_includes lr.errors[:start_date], "can't be blank"
  end

  test "requires end_date" do
    lr = LeaveRequest.new(student: @student, parent: @parent, request_type: :sick, start_date: Date.today, reason: "Sick")
    assert_not lr.valid?
    assert_includes lr.errors[:end_date], "can't be blank"
  end

  test "requires reason" do
    lr = LeaveRequest.new(student: @student, parent: @parent, request_type: :sick, start_date: Date.today, end_date: Date.today)
    assert_not lr.valid?
    assert_includes lr.errors[:reason], "can't be blank"
  end

  test "end_date must be on or after start_date" do
    lr = LeaveRequest.new(
      student: @student, parent: @parent, request_type: :sick,
      start_date: Date.new(2026, 4, 5), end_date: Date.new(2026, 4, 3),
      reason: "Sick"
    )
    assert_not lr.valid?
    assert_includes lr.errors[:end_date], "must be on or after start date"
  end

  test "single day leave is valid" do
    lr = LeaveRequest.new(
      student: @student, parent: @parent, request_type: :excused,
      start_date: Date.new(2026, 4, 1), end_date: Date.new(2026, 4, 1),
      reason: "Family event"
    )
    assert lr.valid?
  end

  test "parent must own student" do
    other_student = students(:student_grace)
    lr = LeaveRequest.new(
      student: other_student, parent: @parent, request_type: :sick,
      start_date: Date.today, end_date: Date.today, reason: "Sick"
    )
    assert_not lr.valid?
    assert_includes lr.errors[:student], "does not belong to this parent"
  end

  test "enum request_types" do
    assert_equal({ "sick" => 0, "excused" => 1 }, LeaveRequest.request_types)
  end

  test "enum statuses" do
    assert_equal({ "pending" => 0, "approved" => 1, "rejected" => 2 }, LeaveRequest.statuses)
  end

  test "defaults to pending status" do
    lr = LeaveRequest.create!(
      student: @student, parent: @parent, request_type: :sick,
      start_date: Date.new(2026, 4, 10), end_date: Date.new(2026, 4, 10),
      reason: "Headache"
    )
    assert lr.pending?
  end

  test "days_count calculation" do
    lr = LeaveRequest.new(start_date: Date.new(2026, 4, 1), end_date: Date.new(2026, 4, 3))
    assert_equal 3, lr.days_count
  end

  test "date_range returns range" do
    lr = LeaveRequest.new(start_date: Date.new(2026, 4, 1), end_date: Date.new(2026, 4, 3))
    assert_equal Date.new(2026, 4, 1)..Date.new(2026, 4, 3), lr.date_range
  end

  test "encrypts reason" do
    lr = LeaveRequest.create!(
      student: @student, parent: @parent, request_type: :sick,
      start_date: Date.new(2026, 4, 10), end_date: Date.new(2026, 4, 10),
      reason: "Doctor visit"
    )
    raw = LeaveRequest.connection.select_value("SELECT reason FROM leave_requests WHERE id = #{lr.id}")
    assert_not_equal "Doctor visit", raw
  end

  test "has_many attendances" do
    lr = leave_requests(:emma_excused_leave_approved)
    assert_respond_to lr, :attendances
  end
end
