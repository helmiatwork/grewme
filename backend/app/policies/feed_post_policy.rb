class FeedPostPolicy < ApplicationPolicy
  def show?
    return true if user.admin?
    return true if user.teacher?
    return true if user.school_manager? && school_post?
    return false unless user.parent?

    user.children
      .joins(:classroom_students)
      .where(classroom_students: { classroom_id: record.classroom_id, status: :active })
      .exists?
  end

  def create?
    return true if user.school_manager? && school_post?
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

  private

  def school_post?
    Classroom.where(id: record.classroom_id, school_id: user.school_id).exists?
  end
end
