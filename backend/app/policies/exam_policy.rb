class ExamPolicy < ApplicationPolicy
  def index?
    user.has_permission?("exams", "index")
  end

  def show?
    user.has_permission?("exams", "show")
  end

  def create?
    user.has_permission?("exams", "create")
  end

  def update?
    user.has_permission?("exams", "update")
  end

  def destroy?
    user.has_permission?("exams", "destroy")
  end
end
