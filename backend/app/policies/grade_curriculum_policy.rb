class GradeCurriculumPolicy < ApplicationPolicy
  def index?
    user.has_permission?("grade_curriculums", "index")
  end

  def show?
    user.has_permission?("grade_curriculums", "show")
  end

  def create?
    user.has_permission?("grade_curriculums", "create")
  end

  def update?
    user.has_permission?("grade_curriculums", "update")
  end
end
