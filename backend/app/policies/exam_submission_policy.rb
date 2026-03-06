class ExamSubmissionPolicy < ApplicationPolicy
  def index?
    user.has_permission?("exam_submissions", "index")
  end

  def show?
    user.has_permission?("exam_submissions", "show")
  end

  def create?
    user.has_permission?("exam_submissions", "create")
  end

  def update?
    user.has_permission?("exam_submissions", "update")
  end

  def destroy?
    user.has_permission?("exam_submissions", "destroy")
  end
end
