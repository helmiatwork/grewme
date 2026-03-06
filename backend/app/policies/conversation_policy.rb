# frozen_string_literal: true

class ConversationPolicy < ApplicationPolicy
  def show?
    participant?
  end

  def create?
    user.teacher? || user.parent?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.for_user(user)
    end
  end

  private

  def participant?
    (user.teacher? && record.teacher_id == user.id) ||
      (user.parent? && record.parent_id == user.id)
  end
end
