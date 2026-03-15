class BehaviorSummaryPolicy < ApplicationPolicy
  def show?
    user.admin? || teacher_of_classroom? || parent_of_student?
  end

  def index?
    user.admin? || user.school_manager? || user.teacher?
  end

  def export?
    user.admin? || user.school_manager?
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

  private

  def teacher_of_classroom?
    user.teacher? && user.classroom_ids.include?(record.classroom_id)
  end

  def parent_of_student?
    user.parent? && user.children.exists?(id: record.student_id)
  end
end
