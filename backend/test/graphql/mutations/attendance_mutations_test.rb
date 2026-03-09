require "test_helper"

class AttendanceMutationsTest < ActiveSupport::TestCase
  BULK_RECORD = <<~GQL
    mutation BulkRecordAttendance($classroomId: ID!, $date: ISO8601Date!, $records: [AttendanceRecordInput!]!) {
      bulkRecordAttendance(classroomId: $classroomId, date: $date, records: $records) {
        attendances { id date status student { id name } }
        errors { message path }
      }
    }
  GQL

  UPDATE_ATTENDANCE = <<~GQL
    mutation UpdateAttendance($attendanceId: ID!, $status: AttendanceStatusEnum!, $notes: String) {
      updateAttendance(attendanceId: $attendanceId, status: $status, notes: $notes) {
        attendance { id status notes }
        errors { message path }
      }
    }
  GQL

  CREATE_LEAVE = <<~GQL
    mutation CreateLeaveRequest($studentId: ID!, $requestType: LeaveRequestTypeEnum!, $startDate: ISO8601Date!, $endDate: ISO8601Date!, $reason: String!) {
      createLeaveRequest(studentId: $studentId, requestType: $requestType, startDate: $startDate, endDate: $endDate, reason: $reason) {
        leaveRequest { id requestType startDate endDate reason status daysCount }
        errors { message path }
      }
    }
  GQL

  DELETE_LEAVE = <<~GQL
    mutation DeleteLeaveRequest($leaveRequestId: ID!) {
      deleteLeaveRequest(leaveRequestId: $leaveRequestId) {
        success
        errors { message path }
      }
    }
  GQL

  REVIEW_LEAVE = <<~GQL
    mutation ReviewLeaveRequest($leaveRequestId: ID!, $decision: LeaveRequestStatusEnum!, $rejectionReason: String) {
      reviewLeaveRequest(leaveRequestId: $leaveRequestId, decision: $decision, rejectionReason: $rejectionReason) {
        leaveRequest { id status reviewedAt rejectionReason }
        errors { message path }
      }
    }
  GQL

  setup do
    @teacher = teachers(:teacher_alice)
    @parent = parents(:parent_carol)
    @student = students(:student_emma)
    @classroom = classrooms(:alice_class)
  end

  # ── Bulk Record Attendance ──

  test "teacher bulk records attendance" do
    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-01",
      "records" => [
        { "studentId" => @student.id.to_s, "status" => "PRESENT" }
      ]
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "bulkRecordAttendance")
    assert_empty data["errors"]
    assert_equal 1, data["attendances"].length
    assert_equal "PRESENT", data["attendances"].first["status"]
  end

  test "bulk record updates existing attendance" do
    Attendance.create!(student: @student, classroom: @classroom, date: "2026-04-02", status: :present, recorded_by: @teacher)

    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-02",
      "records" => [
        { "studentId" => @student.id.to_s, "status" => "SICK", "notes" => "Sent home early" }
      ]
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "bulkRecordAttendance")
    assert_empty data["errors"]
    assert_equal "SICK", data["attendances"].first["status"]
  end

  test "parent cannot bulk record attendance" do
    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-01",
      "records" => [ { "studentId" => @student.id.to_s, "status" => "PRESENT" } ]
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  test "unauthenticated cannot bulk record" do
    result = GrewmeSchema.execute(BULK_RECORD, variables: {
      "classroomId" => @classroom.id.to_s,
      "date" => "2026-04-01",
      "records" => [ { "studentId" => @student.id.to_s, "status" => "PRESENT" } ]
    }, context: { current_user: nil, request: ActionDispatch::TestRequest.create })

    assert result["errors"].any? { |e| e["message"].include?("Authentication") }
  end

  # ── Update Attendance ──

  test "teacher updates attendance" do
    attendance = Attendance.create!(student: @student, classroom: @classroom, date: "2026-04-03", status: :present, recorded_by: @teacher)

    result = GrewmeSchema.execute(UPDATE_ATTENDANCE, variables: {
      "attendanceId" => attendance.id.to_s,
      "status" => "EXCUSED",
      "notes" => "Parent called in"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "updateAttendance")
    assert_empty data["errors"]
    assert_equal "EXCUSED", data["attendance"]["status"]
    assert_equal "Parent called in", data["attendance"]["notes"]
  end

  # ── Create Leave Request ──

  test "parent creates leave request" do
    result = GrewmeSchema.execute(CREATE_LEAVE, variables: {
      "studentId" => @student.id.to_s,
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-11",
      "reason" => "Doctor appointment"
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "createLeaveRequest")
    assert_empty data["errors"]
    assert_equal "PENDING", data["leaveRequest"]["status"]
    assert_equal 2, data["leaveRequest"]["daysCount"]
  end

  test "teacher cannot create leave request" do
    result = GrewmeSchema.execute(CREATE_LEAVE, variables: {
      "studentId" => @student.id.to_s,
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-10",
      "reason" => "Sick"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  # ── Delete Leave Request ──

  test "parent deletes pending leave request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-15", end_date: "2026-04-15", reason: "Headache")

    result = GrewmeSchema.execute(DELETE_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "deleteLeaveRequest")
    assert data["success"]
    assert_raises(ActiveRecord::RecordNotFound) { lr.reload }
  end

  test "parent cannot delete approved leave request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-16", end_date: "2026-04-16", reason: "Flu", status: :approved, reviewed_by: @teacher, reviewed_at: Time.current)

    result = GrewmeSchema.execute(DELETE_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s
    }, context: { current_user: @parent, request: ActionDispatch::TestRequest.create })

    assert result["errors"].present?
  end

  # ── Review Leave Request ──

  test "teacher approves leave request and creates attendance records" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-20", end_date: "2026-04-21", reason: "Flu")

    result = GrewmeSchema.execute(REVIEW_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s,
      "decision" => "APPROVED"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "reviewLeaveRequest")
    assert_empty data["errors"]
    assert_equal "APPROVED", data["leaveRequest"]["status"]
    assert_not_nil data["leaveRequest"]["reviewedAt"]

    # Verify attendance records were created
    attendances = Attendance.where(leave_request_id: lr.id)
    assert attendances.any?
    assert attendances.all?(&:sick?)
  end

  test "teacher rejects leave request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :excused, start_date: "2026-04-22", end_date: "2026-04-22", reason: "Shopping")

    result = GrewmeSchema.execute(REVIEW_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s,
      "decision" => "REJECTED",
      "rejectionReason" => "Not a valid reason"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "reviewLeaveRequest")
    assert_empty data["errors"]
    assert_equal "REJECTED", data["leaveRequest"]["status"]

    # No attendance records created
    assert_equal 0, Attendance.where(leave_request_id: lr.id).count
  end

  test "cannot review already reviewed request" do
    lr = LeaveRequest.create!(student: @student, parent: @parent, request_type: :sick, start_date: "2026-04-23", end_date: "2026-04-23", reason: "Flu", status: :approved, reviewed_by: @teacher, reviewed_at: Time.current)

    result = GrewmeSchema.execute(REVIEW_LEAVE, variables: {
      "leaveRequestId" => lr.id.to_s,
      "decision" => "REJECTED"
    }, context: { current_user: @teacher, request: ActionDispatch::TestRequest.create })

    data = result.dig("data", "reviewLeaveRequest")
    assert data["errors"].any? { |e| e["message"].include?("already been reviewed") }
  end
end
