// ── Attendance Queries ────────────────────────────────────────────────────────

export const CLASSROOM_ATTENDANCE_QUERY = `
  query ClassroomAttendance($classroomId: ID!, $date: ISO8601Date!) {
    classroomAttendance(classroomId: $classroomId, date: $date) {
      id
      date
      status
      notes
      student { id name }
      classroom { id name }
      leaveRequest { id requestType startDate endDate }
      createdAt
      updatedAt
    }
  }
`;

export const STUDENT_ATTENDANCE_QUERY = `
  query StudentAttendance($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
    studentAttendance(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
      id
      date
      status
      notes
      classroom { id name }
      leaveRequest { id requestType }
      createdAt
    }
  }
`;

export const CLASSROOM_ATTENDANCE_SUMMARY_QUERY = `
  query ClassroomAttendanceSummary($classroomId: ID!, $startDate: ISO8601Date!, $endDate: ISO8601Date!) {
    classroomAttendanceSummary(classroomId: $classroomId, startDate: $startDate, endDate: $endDate)
  }
`;

// ── Attendance Mutations ─────────────────────────────────────────────────────

export const BULK_RECORD_ATTENDANCE_MUTATION = `
  mutation BulkRecordAttendance($classroomId: ID!, $date: ISO8601Date!, $records: [AttendanceRecordInput!]!) {
    bulkRecordAttendance(classroomId: $classroomId, date: $date, records: $records) {
      attendances {
        id date status notes
        student { id name }
      }
      errors { message path }
    }
  }
`;

export const UPDATE_ATTENDANCE_MUTATION = `
  mutation UpdateAttendance($attendanceId: ID!, $status: AttendanceStatusEnum!, $notes: String) {
    updateAttendance(attendanceId: $attendanceId, status: $status, notes: $notes) {
      attendance { id date status notes student { id name } }
      errors { message path }
    }
  }
`;

// ── Leave Request Queries ────────────────────────────────────────────────────

export const LEAVE_REQUESTS_QUERY = `
  query LeaveRequests($classroomId: ID, $status: LeaveRequestStatusEnum) {
    leaveRequests(classroomId: $classroomId, status: $status) {
      id
      requestType
      startDate
      endDate
      reason
      status
      rejectionReason
      reviewedAt
      daysCount
      student { id name }
      parent { id name }
      reviewedBy { id name }
      createdAt
    }
  }
`;

export const PARENT_LEAVE_REQUESTS_QUERY = `
  query ParentLeaveRequests($studentId: ID, $status: LeaveRequestStatusEnum) {
    parentLeaveRequests(studentId: $studentId, status: $status) {
      id
      requestType
      startDate
      endDate
      reason
      status
      rejectionReason
      reviewedAt
      daysCount
      student { id name }
      reviewedBy { id name }
      createdAt
    }
  }
`;

// ── Leave Request Mutations ──────────────────────────────────────────────────

export const CREATE_LEAVE_REQUEST_MUTATION = `
  mutation CreateLeaveRequest($studentId: ID!, $requestType: LeaveRequestTypeEnum!, $startDate: ISO8601Date!, $endDate: ISO8601Date!, $reason: String!) {
    createLeaveRequest(studentId: $studentId, requestType: $requestType, startDate: $startDate, endDate: $endDate, reason: $reason) {
      leaveRequest {
        id requestType startDate endDate reason status daysCount
        student { id name }
      }
      errors { message path }
    }
  }
`;

export const REVIEW_LEAVE_REQUEST_MUTATION = `
  mutation ReviewLeaveRequest($leaveRequestId: ID!, $decision: LeaveRequestStatusEnum!, $rejectionReason: String) {
    reviewLeaveRequest(leaveRequestId: $leaveRequestId, decision: $decision, rejectionReason: $rejectionReason) {
      leaveRequest {
        id status rejectionReason reviewedAt
        reviewedBy { id name }
      }
      errors { message path }
    }
  }
`;

export const DELETE_LEAVE_REQUEST_MUTATION = `
  mutation DeleteLeaveRequest($leaveRequestId: ID!) {
    deleteLeaveRequest(leaveRequestId: $leaveRequestId) {
      success
      errors { message path }
    }
  }
`;
