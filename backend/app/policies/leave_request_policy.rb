class LeaveRequestPolicy < ApplicationPolicy
  def create?
    user.parent?
  end

  def delete?
    user.parent? && record.parent_id == user.id && record.pending?
  end

  def review?
    user.teacher? && teaches_student_classroom?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.school_manager?
        scope.joins(student: { classroom_students: :classroom })
          .merge(ClassroomStudent.current)
          .where(classrooms: { school_id: user.school_id })
      elsif user.teacher?
        scope.joins(student: :classroom_students)
          .merge(ClassroomStudent.current)
          .where(classroom_students: {
            classroom_id: user.classroom_teachers.pluck(:classroom_id)
          })
      elsif user.parent?
        scope.where(parent_id: user.id)
      else
        scope.none
      end
    end
  end

  private

  def teaches_student_classroom?
    record.student.classroom_students.current.exists?(
      classroom_id: user.classroom_teachers.pluck(:classroom_id)
    )
  end
end
