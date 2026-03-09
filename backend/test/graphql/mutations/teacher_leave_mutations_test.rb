require "test_helper"

class TeacherLeaveMutationsTest < ActiveSupport::TestCase
  CREATE_TEACHER_LEAVE = <<~GQL
    mutation CreateTeacherLeaveRequest($requestType: TeacherLeaveRequestTypeEnum!, $startDate: ISO8601Date!, $endDate: ISO8601Date!, $reason: String!) {
      createTeacherLeaveRequest(requestType: $requestType, startDate: $startDate, endDate: $endDate, reason: $reason) {
        teacherLeaveRequest { id requestType startDate endDate reason status daysCount }
        errors { message path }
      }
    }
  GQL

  REVIEW_TEACHER_LEAVE = <<~GQL
    mutation ReviewTeacherLeaveRequest($teacherLeaveRequestId: ID!, $decision: LeaveRequestStatusEnum!, $rejectionReason: String, $substituteId: ID) {
      reviewTeacherLeaveRequest(teacherLeaveRequestId: $teacherLeaveRequestId, decision: $decision, rejectionReason: $rejectionReason, substituteId: $substituteId) {
        teacherLeaveRequest { id status rejectionReason reviewedAt substitute { id } }
        errors { message path }
      }
    }
  GQL

  DELETE_TEACHER_LEAVE = <<~GQL
    mutation DeleteTeacherLeaveRequest($teacherLeaveRequestId: ID!) {
      deleteTeacherLeaveRequest(teacherLeaveRequestId: $teacherLeaveRequestId) {
        success
        errors { message path }
      }
    }
  GQL

  UPDATE_LEAVE_SETTINGS = <<~GQL
    mutation UpdateSchoolLeaveSettings($maxAnnualLeaveDays: Int!, $maxSickLeaveDays: Int!) {
      updateSchoolLeaveSettings(maxAnnualLeaveDays: $maxAnnualLeaveDays, maxSickLeaveDays: $maxSickLeaveDays) {
        school { id }
        errors { message path }
      }
    }
  GQL

  MY_REQUESTS = <<~GQL
    query MyTeacherLeaveRequests($status: LeaveRequestStatusEnum) {
      myTeacherLeaveRequests(status: $status) {
        id requestType status daysCount
      }
    }
  GQL

  MY_BALANCE = <<~GQL
    query { myTeacherLeaveBalance { id maxAnnualLeave maxSickLeave usedAnnual usedSick usedPersonal remainingAnnual remainingSick } }
  GQL

  SCHOOL_REQUESTS = <<~GQL
    query SchoolTeacherLeaveRequests($status: LeaveRequestStatusEnum, $teacherId: ID) {
      schoolTeacherLeaveRequests(status: $status, teacherId: $teacherId) {
        id requestType status teacher { id }
      }
    }
  GQL

  SCHOOL_SETTINGS = <<~GQL
    query { schoolLeaveSettings }
  GQL

  setup do
    @teacher_alice = teachers(:teacher_alice)
    @teacher_bob = teachers(:teacher_bob)
    @manager = school_managers(:manager_pat)
    @parent = parents(:parent_carol)
    @pending_request = teacher_leave_requests(:pending_sick)
    @approved_request = teacher_leave_requests(:approved_annual)
  end

  def ctx(user)
    { current_user: user, request: ActionDispatch::TestRequest.create }
  end

  # ── Create Teacher Leave Request ──

  test "teacher creates leave request" do
    result = GrewmeSchema.execute(CREATE_TEACHER_LEAVE, variables: {
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-11",
      "reason" => "Flu symptoms"
    }, context: ctx(@teacher_alice))

    data = result.dig("data", "createTeacherLeaveRequest")
    assert_empty data["errors"]
    assert_equal "pending", data["teacherLeaveRequest"]["status"]
    assert_equal "sick", data["teacherLeaveRequest"]["requestType"]
    assert_equal 2, data["teacherLeaveRequest"]["daysCount"]
  end

  test "parent cannot create teacher leave request" do
    result = GrewmeSchema.execute(CREATE_TEACHER_LEAVE, variables: {
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-10",
      "reason" => "Sick"
    }, context: ctx(@parent))

    assert result["errors"].present?
  end

  test "unauthenticated cannot create teacher leave request" do
    result = GrewmeSchema.execute(CREATE_TEACHER_LEAVE, variables: {
      "requestType" => "SICK",
      "startDate" => "2026-04-10",
      "endDate" => "2026-04-10",
      "reason" => "Sick"
    }, context: ctx(nil))

    assert result["errors"].any? { |e| e["message"].include?("Authentication") }
  end

  # ── Review Teacher Leave Request ──

  test "manager approves leave request" do
    result = GrewmeSchema.execute(REVIEW_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @pending_request.id.to_s,
      "decision" => "APPROVED"
    }, context: ctx(@manager))

    data = result.dig("data", "reviewTeacherLeaveRequest")
    assert_empty data["errors"]
    assert_equal "approved", data["teacherLeaveRequest"]["status"]
    assert_not_nil data["teacherLeaveRequest"]["reviewedAt"]
  end

  test "manager approves with substitute" do
    result = GrewmeSchema.execute(REVIEW_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @pending_request.id.to_s,
      "decision" => "APPROVED",
      "substituteId" => @teacher_bob.id.to_s
    }, context: ctx(@manager))

    data = result.dig("data", "reviewTeacherLeaveRequest")
    assert_empty data["errors"]
    assert_equal "approved", data["teacherLeaveRequest"]["status"]
    assert_equal @teacher_bob.id.to_s, data["teacherLeaveRequest"]["substitute"]["id"]
  end

  test "manager rejects leave request" do
    result = GrewmeSchema.execute(REVIEW_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @pending_request.id.to_s,
      "decision" => "REJECTED",
      "rejectionReason" => "Insufficient notice"
    }, context: ctx(@manager))

    data = result.dig("data", "reviewTeacherLeaveRequest")
    assert_empty data["errors"]
    assert_equal "rejected", data["teacherLeaveRequest"]["status"]
    assert_equal "Insufficient notice", data["teacherLeaveRequest"]["rejectionReason"]
  end

  test "cannot review already reviewed request" do
    result = GrewmeSchema.execute(REVIEW_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @approved_request.id.to_s,
      "decision" => "REJECTED"
    }, context: ctx(@manager))

    data = result.dig("data", "reviewTeacherLeaveRequest")
    assert data["errors"].any? { |e| e["message"].include?("already been reviewed") }
  end

  test "teacher cannot review leave request" do
    result = GrewmeSchema.execute(REVIEW_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @pending_request.id.to_s,
      "decision" => "APPROVED"
    }, context: ctx(@teacher_bob))

    assert result["errors"].present?
  end

  # ── Delete Teacher Leave Request ──

  test "teacher deletes own pending leave request" do
    result = GrewmeSchema.execute(DELETE_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @pending_request.id.to_s
    }, context: ctx(@teacher_alice))

    data = result.dig("data", "deleteTeacherLeaveRequest")
    assert data["success"]
    assert_raises(ActiveRecord::RecordNotFound) { @pending_request.reload }
  end

  test "teacher cannot delete approved leave request" do
    result = GrewmeSchema.execute(DELETE_TEACHER_LEAVE, variables: {
      "teacherLeaveRequestId" => @approved_request.id.to_s
    }, context: ctx(@teacher_bob))

    assert result["errors"].present?
  end

  # ── Update School Leave Settings ──

  test "manager updates leave settings" do
    result = GrewmeSchema.execute(UPDATE_LEAVE_SETTINGS, variables: {
      "maxAnnualLeaveDays" => 15,
      "maxSickLeaveDays" => 10
    }, context: ctx(@manager))

    data = result.dig("data", "updateSchoolLeaveSettings")
    assert_empty data["errors"]
    assert_not_nil data["school"]["id"]

    @manager.school.reload
    assert_equal 15, @manager.school.max_annual_leave_days
    assert_equal 10, @manager.school.max_sick_leave_days
  end

  test "teacher cannot update leave settings" do
    result = GrewmeSchema.execute(UPDATE_LEAVE_SETTINGS, variables: {
      "maxAnnualLeaveDays" => 15,
      "maxSickLeaveDays" => 10
    }, context: ctx(@teacher_alice))

    assert result["errors"].present?
  end

  # ── Queries ──

  test "teacher queries own leave requests" do
    result = GrewmeSchema.execute(MY_REQUESTS, variables: {}, context: ctx(@teacher_alice))

    data = result.dig("data", "myTeacherLeaveRequests")
    assert data.is_a?(Array)
    assert data.any? { |r| r["id"] == @pending_request.id.to_s }
  end

  test "teacher queries own leave requests filtered by status" do
    result = GrewmeSchema.execute(MY_REQUESTS, variables: { "status" => "PENDING" }, context: ctx(@teacher_alice))

    data = result.dig("data", "myTeacherLeaveRequests")
    assert data.all? { |r| r["status"] == "pending" }
  end

  test "teacher queries own leave balance" do
    result = GrewmeSchema.execute(MY_BALANCE, context: ctx(@teacher_alice))

    data = result.dig("data", "myTeacherLeaveBalance")
    assert_not_nil data
    assert_equal 12, data["maxAnnualLeave"]
    assert_equal 14, data["maxSickLeave"]
  end

  test "manager queries school teacher leave requests" do
    result = GrewmeSchema.execute(SCHOOL_REQUESTS, variables: {}, context: ctx(@manager))

    data = result.dig("data", "schoolTeacherLeaveRequests")
    assert data.is_a?(Array)
    assert data.length >= 2  # pending_sick + approved_annual
  end

  test "manager queries school leave settings" do
    result = GrewmeSchema.execute(SCHOOL_SETTINGS, context: ctx(@manager))

    assert_nil result["errors"], "Expected no errors but got: #{result["errors"]&.inspect}"
    data = result.dig("data", "schoolLeaveSettings")
    assert_not_nil data, "schoolLeaveSettings was nil"
    # GraphQL::Types::JSON preserves Ruby symbol keys
    assert_equal 12, data[:maxAnnualLeaveDays]
    assert_equal 14, data[:maxSickLeaveDays]
  end

  test "teacher cannot query school leave requests" do
    result = GrewmeSchema.execute(SCHOOL_REQUESTS, variables: {}, context: ctx(@teacher_alice))

    assert result["errors"].present?
  end
end
