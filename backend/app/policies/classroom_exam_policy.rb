class ClassroomExamPolicy < ApplicationPolicy
  def index?
    user.has_permission?("classroom_exams", "index")
  end

  def show?
    user.has_permission?("classroom_exams", "show")
  end

  def create?
    user.has_permission?("classroom_exams", "create")
  end

  def update?
    user.has_permission?("classroom_exams", "update")
  end

  def destroy?
    user.has_permission?("classroom_exams", "destroy")
  end
end
