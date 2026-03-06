class TopicPolicy < ApplicationPolicy
  def index?
    user.has_permission?("topics", "index")
  end

  def show?
    user.has_permission?("topics", "show")
  end

  def create?
    user.has_permission?("topics", "create")
  end

  def update?
    user.has_permission?("topics", "update")
  end

  def destroy?
    user.has_permission?("topics", "destroy")
  end
end
