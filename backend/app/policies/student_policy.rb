class StudentPolicy < ApplicationPolicy
  def show?
    permitted?(:show) && (user.admin? || teaches_student? || parents_student?)
  end

  def radar?
    permitted?(:radar) && (user.admin? || teaches_student? || parents_student?)
  end

  def progress?
    permitted?(:progress) && (user.admin? || teaches_student? || parents_student?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.teacher?
        scope.joins(classroom_students: :classroom).merge(ClassroomStudent.current).where(classrooms: { teacher_id: user.id })
      elsif user.parent?
        scope.joins(:parent_students).where(parent_students: { parent_id: user.id })
      else
        scope.none
      end
    end
  end

  private

  def teaches_student?
    user.teacher? && record.current_classroom&.teacher_id == user.id
  end

  def parents_student?
    user.parent? && user.children.exists?(record.id)
  end
end
