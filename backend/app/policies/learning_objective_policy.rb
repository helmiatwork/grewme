class LearningObjectivePolicy < ApplicationPolicy
  def index?
    user.has_permission?("learning_objectives", "index")
  end

  def show?
    user.has_permission?("learning_objectives", "show")
  end

  def create?
    user.has_permission?("learning_objectives", "create")
  end

  def update?
    user.has_permission?("learning_objectives", "update")
  end

  def destroy?
    user.has_permission?("learning_objectives", "destroy")
  end
end
