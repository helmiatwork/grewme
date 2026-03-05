class ClassroomEventPolicy < ApplicationPolicy
  # Both teachers and parents can see events for classrooms they belong to
  def show?
    classroom_member?
  end

  def create?
    classroom_member?
  end

  # Only the creator can delete
  def destroy?
    record.creator_type == user.class.name && record.creator_id == user.id
  end

  private

  def classroom_member?
    if user.teacher?
      user.classrooms.exists?(id: record.classroom_id)
    elsif user.parent?
      user.children
        .joins(:classroom_students)
        .where(classroom_students: { classroom_id: record.classroom_id, status: :active })
        .exists?
    else
      false
    end
  end
end
