class AttendancePolicy < ApplicationPolicy
  def create?
    user.teacher? && permitted?(:create)
  end

  def update?
    user.teacher? && permitted?(:update) && teaches_classroom?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(:classroom).where(classrooms: { school_id: user.school_id })
      elsif user.teacher?
        scope.where(classroom_id: user.classroom_teachers.pluck(:classroom_id))
      elsif user.parent?
        scope.joins(student: :parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_classroom?
    user.classroom_teachers.exists?(classroom_id: record.classroom_id)
  end
end
