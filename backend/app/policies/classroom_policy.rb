class ClassroomPolicy < ApplicationPolicy
  def index?
    user.teacher? || user.admin?
  end

  def show?
    user.admin? || owns_classroom?
  end

  def overview?
    show?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.where(teacher_id: user.id)
      else
        scope.none
      end
    end
  end

  private

  def owns_classroom?
    user.teacher? && record.teacher_id == user.id
  end
end
