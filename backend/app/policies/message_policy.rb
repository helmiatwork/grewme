# frozen_string_literal: true

class MessagePolicy < ApplicationPolicy
  def create?
    ConversationPolicy.new(user, record.conversation).show?
  end
end
