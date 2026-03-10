// ── Teacher Leave Queries ────────────────────────────────────────────────────

export const MY_TEACHER_LEAVE_REQUESTS_QUERY = `
  query MyTeacherLeaveRequests($status: LeaveRequestStatusEnum) {
    myTeacherLeaveRequests(status: $status) {
      id
      requestType
      startDate
      endDate
      reason
      status
      rejectionReason
      reviewedAt
      daysCount
      halfDaySession
      teacher { id name }
      reviewedBy { id name }
      substitute { id name }
      createdAt
    }
  }
`;

export const MY_TEACHER_LEAVE_BALANCE_QUERY = `
  query MyTeacherLeaveBalance {
    myTeacherLeaveBalance {
      id
      maxAnnualLeave
      maxSickLeave
      usedAnnual
      usedSick
      usedPersonal
      remainingAnnual
      remainingSick
    }
  }
`;

export const SCHOOL_TEACHER_LEAVE_REQUESTS_QUERY = `
  query SchoolTeacherLeaveRequests($status: LeaveRequestStatusEnum, $teacherId: ID) {
    schoolTeacherLeaveRequests(status: $status, teacherId: $teacherId) {
      id
      requestType
      startDate
      endDate
      reason
      status
      rejectionReason
      reviewedAt
      daysCount
      halfDaySession
      teacher { id name }
      reviewedBy { id name }
      substitute { id name }
      createdAt
    }
  }
`;

export const SCHOOL_LEAVE_SETTINGS_QUERY = `
  query SchoolLeaveSettings {
    schoolLeaveSettings
  }
`;

// ── Teacher Leave Mutations ──────────────────────────────────────────────────

export const CREATE_TEACHER_LEAVE_REQUEST_MUTATION = `
  mutation CreateTeacherLeaveRequest($requestType: TeacherLeaveRequestTypeEnum!, $startDate: ISO8601Date!, $endDate: ISO8601Date!, $reason: String!, $halfDaySession: HalfDaySessionEnum) {
    createTeacherLeaveRequest(requestType: $requestType, startDate: $startDate, endDate: $endDate, reason: $reason, halfDaySession: $halfDaySession) {
      teacherLeaveRequest {
        id requestType startDate endDate reason status daysCount halfDaySession
      }
      errors { message path }
    }
  }
`;

export const REVIEW_TEACHER_LEAVE_REQUEST_MUTATION = `
  mutation ReviewTeacherLeaveRequest($teacherLeaveRequestId: ID!, $decision: LeaveRequestStatusEnum!, $rejectionReason: String, $substituteId: ID) {
    reviewTeacherLeaveRequest(teacherLeaveRequestId: $teacherLeaveRequestId, decision: $decision, rejectionReason: $rejectionReason, substituteId: $substituteId) {
      teacherLeaveRequest {
        id status rejectionReason reviewedAt
        reviewedBy { id name }
        substitute { id name }
      }
      errors { message path }
    }
  }
`;

export const DELETE_TEACHER_LEAVE_REQUEST_MUTATION = `
  mutation DeleteTeacherLeaveRequest($teacherLeaveRequestId: ID!) {
    deleteTeacherLeaveRequest(teacherLeaveRequestId: $teacherLeaveRequestId) {
      success
      errors { message path }
    }
  }
`;

export const UPDATE_SCHOOL_LEAVE_SETTINGS_MUTATION = `
  mutation UpdateSchoolLeaveSettings($maxAnnualLeaveDays: Int!, $maxSickLeaveDays: Int!) {
    updateSchoolLeaveSettings(maxAnnualLeaveDays: $maxAnnualLeaveDays, maxSickLeaveDays: $maxSickLeaveDays) {
      school { id }
      errors { message path }
    }
  }
`;

export const SCHOOL_TEACHERS_QUERY = `
  query SchoolTeachers {
    schoolTeachers { id name }
  }
`;
