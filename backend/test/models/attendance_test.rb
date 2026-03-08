require "test_helper"

class AttendanceTest < ActiveSupport::TestCase
  setup do
    @student = students(:student_emma)
    @teacher = teachers(:teacher_alice)
    @classroom = classrooms(:alice_class)
  end

  test "valid attendance record" do
    attendance = Attendance.new(
      student: @student, classroom: @classroom,
      date: Date.new(2026, 4, 1), status: :present,
      recorded_by: @teacher
    )
    assert attendance.valid?, attendance.errors.full_messages.join(", ")
  end

  test "requires date" do
    attendance = Attendance.new(student: @student, classroom: @classroom, status: :present)
    assert_not attendance.valid?
    assert_includes attendance.errors[:date], "can't be blank"
  end

  test "requires status" do
    attendance = Attendance.new(student: @student, classroom: @classroom, date: Date.today)
    attendance.status = nil
    assert_not attendance.valid?
  end

  test "unique per student per classroom per date" do
    Attendance.create!(student: @student, classroom: @classroom, date: Date.new(2026, 4, 2), status: :present, recorded_by: @teacher)
    duplicate = Attendance.new(student: @student, classroom: @classroom, date: Date.new(2026, 4, 2), status: :sick)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:student_id], "already has attendance for this classroom on this date"
  end

  test "enum statuses" do
    assert_equal({ "present" => 0, "sick" => 1, "excused" => 2, "unexcused" => 3 }, Attendance.statuses)
  end

  test "for_date scope" do
    records = Attendance.for_date(Date.new(2026, 3, 1))
    assert records.all? { |r| r.date == Date.new(2026, 3, 1) }
  end

  test "for_classroom scope" do
    records = Attendance.for_classroom(@classroom.id)
    assert records.all? { |r| r.classroom_id == @classroom.id }
  end

  test "absent scope excludes present" do
    records = Attendance.absent
    assert records.none?(&:present?)
  end

  test "encrypts notes" do
    attendance = Attendance.create!(
      student: @student, classroom: @classroom,
      date: Date.new(2026, 4, 3), status: :sick,
      recorded_by: @teacher, notes: "Had a fever"
    )
    assert_equal "Had a fever", attendance.notes
    raw = Attendance.connection.select_value("SELECT notes FROM attendances WHERE id = #{attendance.id}")
    assert_not_equal "Had a fever", raw
  end

  test "belongs to student and classroom" do
    attendance = attendances(:emma_present_mar1)
    assert_equal @student, attendance.student
    assert_equal @classroom, attendance.classroom
  end

  test "leave_request association is optional" do
    attendance = Attendance.new(
      student: @student, classroom: @classroom,
      date: Date.new(2026, 4, 4), status: :present,
      recorded_by: @teacher
    )
    assert attendance.valid?
    assert_nil attendance.leave_request
  end
end
