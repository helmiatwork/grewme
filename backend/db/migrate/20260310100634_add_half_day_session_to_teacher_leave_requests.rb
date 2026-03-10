# frozen_string_literal: true

class AddHalfDaySessionToTeacherLeaveRequests < ActiveRecord::Migration[8.1]
  def change
    add_column :teacher_leave_requests, :half_day_session, :integer, default: nil
  end
end
