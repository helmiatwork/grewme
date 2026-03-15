class BehaviorChannel < ApplicationCable::Channel
  def subscribed
    classroom = Classroom.find(params[:classroom_id])

    unless current_user.teacher? && current_user.classrooms.exists?(id: classroom.id)
      reject
      return
    end

    stream_for classroom
  end

  def unsubscribed
  end
end
