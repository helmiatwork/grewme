class FeedPostPolicy < ApplicationPolicy
  def show?
    return true if user.teacher?
    return false unless user.parent?

    # Parent can see posts from classrooms where their child is enrolled
    user.children
      .joins(:classroom_students)
      .where(classroom_students: { classroom_id: record.classroom_id, status: :active })
      .exists?
  end

  def create?
    user.teacher? && user.classrooms.exists?(id: record.classroom_id)
  end

  def destroy?
    user.teacher? && record.teacher_id == user.id
  end

  def like?
    show?
  end

  def comment?
    show?
  end
end
