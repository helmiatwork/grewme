class BehaviorPointPolicy < ApplicationPolicy
  def create?
    user.teacher? && user.classrooms.exists?(id: record.classroom_id)
  end

  def revoke?
    user.teacher? && record.teacher_id == user.id && record.revokable?
  end

  def index?
    true
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(classroom: :school).where(schools: { id: user.school_id })
      elsif user.teacher?
        scope.where(classroom_id: user.classroom_ids)
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end
end
