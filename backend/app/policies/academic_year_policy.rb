class AcademicYearPolicy < ApplicationPolicy
  def index?
    user.has_permission?("academic_years", "index")
  end

  def show?
    user.has_permission?("academic_years", "show")
  end

  def create?
    user.has_permission?("academic_years", "create")
  end

  def update?
    user.has_permission?("academic_years", "update")
  end
end
