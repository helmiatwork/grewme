class SubjectPolicy < ApplicationPolicy
  def index?
    user.has_permission?("subjects", "index")
  end

  def show?
    user.has_permission?("subjects", "show")
  end

  def create?
    user.has_permission?("subjects", "create")
  end

  def update?
    user.has_permission?("subjects", "update")
  end

  def destroy?
    user.has_permission?("subjects", "destroy")
  end
end
