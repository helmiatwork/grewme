class TeacherLeaveRequestPolicy < ApplicationPolicy
  def create?
    user.teacher?
  end

  def delete?
    user.teacher? && record.teacher_id == user.id && record.pending?
  end

  def review?
    user.school_manager? && record.school_id == user.school_id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.where(school_id: user.school_id)
      elsif user.teacher?
        scope.where(teacher_id: user.id)
      else
        scope.none
      end
    end
  end
end
