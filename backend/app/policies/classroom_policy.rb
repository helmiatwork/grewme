class ClassroomPolicy < ApplicationPolicy
  def index?
    permitted?(:index)
  end

  def show?
    permitted?(:show) && (user.admin? || owns_classroom?)
  end

  def overview?
    permitted?(:overview) && (user.admin? || owns_classroom?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.has_permission?("classrooms", "index")
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
