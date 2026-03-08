# Attendance & Leave Request System — Design

**Date:** 2026-03-08
**Status:** Approved
**Context:** GrewMe (Rails 8.1.2 + SvelteKit + GraphQL)

## Overview

Daily attendance tracking for Indonesian elementary schools (SD) with parent leave request workflow. Phase 1 uses manual teacher check-in; Phase 2 (future) adds face detection.

## Requirements

- **Statuses:** Hadir (present), Sakit (sick), Izin (excused), Alpha (unexcused)
- **Teacher:** Bulk-marks attendance per classroom per day. Reviews parent leave requests (approve/reject).
- **Parent:** Submits leave requests (sick/excused) with date range + reason. Can delete pending requests (no editing — delete and recreate). Views child's attendance history.
- **School Manager:** Read-only dashboard with per-classroom summaries and chronic absenteeism alerts.
- **Leave requests are immutable** — no edit mutation for anyone.

## Data Model

### `attendances` table

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| student_id | bigint FK | NOT NULL |
| classroom_id | bigint FK | NOT NULL |
| date | date | NOT NULL |
| status | integer (enum) | 0=present, 1=sick, 2=excused, 3=unexcused |
| recorded_by_type | string | Polymorphic: "Teacher" or "System" |
| recorded_by_id | bigint | |
| leave_request_id | bigint FK | NULL unless from approved leave |
| notes | text (encrypted) | Optional, COPPA-safe |
| created_at / updated_at | datetime | |

**Unique index:** `(student_id, classroom_id, date)`

### `leave_requests` table

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| student_id | bigint FK | NOT NULL |
| parent_id | bigint FK | NOT NULL |
| request_type | integer (enum) | 0=sick, 1=excused |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL |
| reason | text (encrypted) | Required, COPPA-safe |
| status | integer (enum) | 0=pending, 1=approved, 2=rejected |
| reviewed_by_id | bigint FK | NULL until reviewed (Teacher) |
| reviewed_at | datetime | NULL until reviewed |
| rejection_reason | text | Optional, only if rejected |
| created_at / updated_at | datetime | |

**Index:** `(student_id, status)`

### Associations

```
Attendance belongs_to :student, :classroom
           belongs_to :recorded_by (polymorphic)
           belongs_to :leave_request (optional)

LeaveRequest belongs_to :student, :parent
             belongs_to :reviewed_by (Teacher, optional)
             has_many :attendances
```

## GraphQL API

### Mutations

| Mutation | Role | Description |
|----------|------|-------------|
| bulkRecordAttendance | Teacher | Marks attendance for entire classroom. Input: classroomId, date, records: [{ studentId, status, notes? }] |
| updateAttendance | Teacher | Edit single student's status/notes. Input: attendanceId, status, notes? |
| createLeaveRequest | Parent | Submit leave. Input: studentId, requestType, startDate, endDate, reason |
| deleteLeaveRequest | Parent | Cancel pending request only. Input: leaveRequestId |
| reviewLeaveRequest | Teacher | Approve/reject. Input: leaveRequestId, decision, rejectionReason?. Approve → auto-creates attendance records |

### Queries

| Query | Role | Description |
|-------|------|-------------|
| classroomAttendance | Teacher, School | All students for a classroom on a date |
| studentAttendance | Teacher, Parent, School | One student's history with date filters |
| classroomAttendanceSummary | Teacher, School | Aggregate stats per classroom for date range |
| leaveRequests | Teacher | Pending/all requests for teacher's classrooms |
| parentLeaveRequests | Parent | Own submitted requests |

### Authorization

- **Teacher:** Own classrooms only (via ClassroomTeacher join). Can record, update attendance, review leave requests.
- **Parent:** Own children only (via parent.children). Active consent required for viewing. Can create/delete own leave requests.
- **School Manager:** Read-only for all classrooms in their school. No mutations.

## Business Logic

### Attendance Recording
- No record = "not yet marked" (not assumed present/absent)
- Bulk save creates or updates (re-opening pre-fills existing records)
- No weekend/holiday validation — teacher simply won't mark non-school days

### Leave Request → Attendance Sync
- **Approve:** Creates one attendance record per day in range. Status maps: sick→sick, excused→excused. Links via leave_request_id.
- **Delete:** Only if pending. No attendance records to clean up.
- **Reject:** Request stays with rejected status. No attendance records.
- **Conflict:** Approved leave overwrites existing manual attendance for those days.

### Reporting
- Summary returns: totalDays, presentCount, sickCount, excusedCount, unexcusedCount, attendanceRate per student.
- Chronic absenteeism flag: ≥3 unexcused days in current month.

### Cache Invalidation
- after_commit hooks invalidate classroom_attendance/{id}/{date} and student_attendance/{id}.

### Notifications
- Parent submits leave → notify classroom teacher
- Teacher approves/rejects → notify parent
- Uses existing Notification model

## Frontend Pages

### Teacher
- `/teacher/attendance` — Date picker + classroom selector. Student list with status toggles. Bulk save.
- `/teacher/attendance/requests` — Leave request inbox. Approve/reject buttons. Filter by classroom, status.

### Parent
- `/parent/attendance` — Per-child attendance history (calendar/list). Summary stats.
- `/parent/attendance/leave` — Own leave requests list. New request form. Delete pending.

### School Manager
- `/school/attendance` — Dashboard with per-classroom attendance rates. Drill-down. Chronic absenteeism alerts.

## Testing Strategy

- **Model specs:** Validations, uniqueness, enum, associations
- **Mutation specs:** Happy path, authorization, duplicate handling, approve→creates records, delete only pending
- **Query specs:** Role-based access, consent checks, correct aggregation
- **Policy specs:** Pundit policies for all roles
- **Frontend:** Build verification (vite build)

## Future (Phase 2)
- Face detection check-in via camera
- QR code alternative
- Timetable integration (per-period attendance)
