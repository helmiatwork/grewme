require "test_helper"

class AttendanceQueryTest < ActiveSupport::TestCase
  CLASSROOM_ATTENDANCE = <<~GQL
    query ClassroomAttendance($classroomId: ID!, $date: ISO8601Date!) {
      classroomAttendance(classroomId: $classroomId, date: $date) {
        id date status student { id name }
      }
    }
  GQL

  STUDENT_ATTENDANCE = <<~GQL
    query StudentAttendance($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
      studentAttendance(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
        id date status
      }
    }
  GQL

  SUMMARY = <<~GQL
    query ClassroomAttendanceSummary($classroomId: ID!, $startDate: ISO8601Date!, $endDate: ISO8601Date!) {
      classroomAttendanceSummary(classroomId: $classroomId, startDate: $startDate, endDate: $endDate)
    }
  GQL

  LEAVE_REQUESTS = <<~GQL
    query LeaveRequests($classroomId: ID, $status: LeaveRequestStatusEnum) {
      leaveRequests(classroomId: $classroomId, status: $status) {
        id requestType startDate endDate reason status student { id name }
      }
    }
  GQL

  PARENT_LEAVE_REQUESTS = <<~GQL
    query ParentLeaveRequests($studentId: ID, $status: LeaveRequestStatusEnum) {
      parentLeaveRequests(studentId: $studentId, status: $status) {
        id requestType startDate endDate status
      }
    }
  GQL

  setup do
    @teacher = teachers(:teacher_alice)
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
    @classroom = classrooms(:alice_class)
  end

  test "teacher views classroom attendance" do
    result = GrewmeSchema.execute(CLASSROOM_ATTENDANCE, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-03-01"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "classroomAttendance")
    assert_not_nil data
  end

  test "parent cannot view classroom attendance" do
    result = GrewmeSchema.execute(CLASSROOM_ATTENDANCE, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-03-01"
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  test "teacher views student attendance" do
    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "studentAttendance")
    assert_not_nil data
  end

  test "parent with consent views student attendance" do
    Consent.create!(student: @student, parent: @parent, parent_email: @parent.email, consent_method: "email_plus", status: :granted, granted_at: Time.current)

    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "studentAttendance")
    assert_not_nil data
  end

  test "parent without consent denied student attendance" do
    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("consent") || e["message"].include?("authorized") }
  end

  test "date range filtering on student attendance" do
    Attendance.create!(student: @student, classroom: @classroom, date: "2026-03-15", status: :present, recorded_by: @teacher)
    Attendance.create!(student: @student, classroom: @classroom, date: "2026-04-15", status: :present, recorded_by: @teacher)

    result = GrewmeSchema.execute(STUDENT_ATTENDANCE, variables: {
      "studentId" => @student.id.to_s,
      "startDate" => "2026-03-01",
      "endDate" => "2026-03-31"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "studentAttendance")
    assert data.all? { |a| a["date"] >= "2026-03-01" && a["date"] <= "2026-03-31" }
  end

  test "classroom attendance summary" do
    result = GrewmeSchema.execute(SUMMARY, variables: {
      "classroomId" => @classroom.id.to_s,
      "startDate" => "2026-03-01",
      "endDate" => "2026-03-31"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "classroomAttendanceSummary")
    assert_not_nil data
    assert data.is_a?(Array)
  end

  test "teacher views leave requests" do
    result = GrewmeSchema.execute(LEAVE_REQUESTS, variables: {},
      context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "leaveRequests")
    assert_not_nil data
  end

  test "parent views own leave requests" do
    LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-10", end_date: "2026-04-10", reason: "Sick")

    result = GrewmeSchema.execute(PARENT_LEAVE_REQUESTS, variables: {},
      context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "parentLeaveRequests")
    assert_not_nil data
    assert data.length >= 1
  end
end
