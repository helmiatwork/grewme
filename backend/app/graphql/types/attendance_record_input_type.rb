# frozen_string_literal: true

module Types
  class AttendanceRecordInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :status, Types::AttendanceStatusEnum, required: true
    argument :notes, String, required: false
  end
end
