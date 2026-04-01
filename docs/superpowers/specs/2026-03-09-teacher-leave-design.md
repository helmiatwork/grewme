# Teacher Leave Request System — Design

**Date**: 2026-03-09
**Status**: Approved

## Overview

Teachers request sick/personal/annual leave from school managers. Managers review, optionally assign substitutes. Leave balances are tracked per academic year with school-configurable limits.

## Models

### TeacherLeaveRequest

| Field | Type | Notes |
|---|---|---|
| teacher_id | FK (required) | who's requesting |
| school_id | FK (required) | for querying |
| request_type | enum: sick, personal, annual | |
| status | enum: pending, approved, rejected | |
| start_date | date (required) | |
| end_date | date (required) | |
| reason | text (encrypted) | PII |
| rejection_reason | text (encrypted) | |
| reviewed_by_id | FK → school_managers (nullable) | |
| reviewed_at | datetime | |
| substitute_id | FK → teachers (nullable) | assigned on approval |

### TeacherLeaveBalance

| Field | Type | Notes |
|---|---|---|
| teacher_id | FK (required) | unique per academic_year |
| academic_year_id | FK (required) | |
| max_annual_leave | integer | default from school |
| max_sick_leave | integer | default from school |
| used_annual | integer | default 0, auto-tracked |
| used_sick | integer | default 0 |
| used_personal | integer | default 0, draws from annual pool |

### School (add columns)

| Field | Type | Notes |
|---|---|---|
| max_annual_leave_days | integer | default 12 |
| max_sick_leave_days | integer | default 14 |

## Business Rules

- **Sick leave**: capped at `max_sick_leave_days` per academic year
- **Annual + Personal**: both draw from `max_annual_leave_days` pool
- On submit: check remaining balance → reject if exceeded
- On approval: increment `used_*` counter by days_count
- On rejection or deletion of approved: decrement counter
- Delete only allowed for pending requests
- Balance auto-created on first request if not exists
- `days_count = (end_date - start_date).to_i + 1`

## Authorization (Pundit)

| Action | Who |
|---|---|
| Create | Teacher (own leave, same school) |
| Delete | Teacher (own + pending only) |
| Review | SchoolManager (same school) |
| View | Teacher (own) + SchoolManager (school's teachers) |

## GraphQL API

### Mutations
- `createTeacherLeaveRequest(requestType, startDate, endDate, reason)` → teacher only
- `reviewTeacherLeaveRequest(id, decision, rejectionReason?, substituteId?)` → manager only
- `deleteTeacherLeaveRequest(id)` → teacher, pending only

### Queries
- `myTeacherLeaveRequests(status?)` → teacher's own requests + balance
- `schoolTeacherLeaveRequests(status?, teacherId?)` → manager sees all school requests

## Frontend Pages

| Route | Role | Features |
|---|---|---|
| `/teacher/my-leave` | Teacher | Balance cards, submit form, request list |
| `/school/teacher-leave` | Manager | Review requests, assign substitute, see balance |
| `/school/settings/academic-years` | Manager | Add max leave day fields |

## Notifications
- Teacher submits → school manager notification
- Manager reviews → teacher notification
