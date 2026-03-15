class BehaviorCategoryPolicy < ApplicationPolicy
  def index?
    user.school_manager? || user.teacher? || user.admin?
  end

  def create?
    user.admin? || (user.school_manager? && record.school_id == user.school_id)
  end

  def update?
    create?
  end

  def destroy?
    create?
  end

  def reorder?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.where(school_id: user.school_id)
      elsif user.teacher?
        scope.where(school_id: user.school_id)
      else
        scope.none
      end
    end
  end
end
