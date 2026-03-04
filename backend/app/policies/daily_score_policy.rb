class DailyScorePolicy < ApplicationPolicy
  def create?
    user.teacher? || user.admin?
  end

  def update?
    user.admin? || (user.teacher? && record.teacher_id == user.id)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.where(teacher_id: user.id)
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end
end
