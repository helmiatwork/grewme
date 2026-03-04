class DailyScorePolicy < ApplicationPolicy
  def create?
    permitted?(:create)
  end

  def update?
    permitted?(:update) && (user.admin? || owns_score?)
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

  private

  def owns_score?
    user.teacher? && record.teacher_id == user.id
  end
end
