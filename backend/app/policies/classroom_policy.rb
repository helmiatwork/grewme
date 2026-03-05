class ClassroomPolicy < ApplicationPolicy
  def index?
    permitted?(:index)
  end

  def show?
    permitted?(:show) && (user.admin? || user.school_manager? && school_classroom? || teaches_classroom?)
  end

  def overview?
    permitted?(:overview) && (user.admin? || user.school_manager? && school_classroom? || teaches_classroom?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.where(school: user.school)
      elsif user.has_permission?("classrooms", "index")
        scope.joins(:classroom_teachers).where(classroom_teachers: { teacher_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_classroom?
    user.teacher? && record.classroom_teachers.exists?(teacher_id: user.id)
  end

  def school_classroom?
    record.school_id == user.school.id
  end
end
