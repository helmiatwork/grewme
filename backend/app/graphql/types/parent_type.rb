# frozen_string_literal: true

module Types
  class ParentType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :children, [ Types::StudentType ], null: false

    def children
      object.children
    end
  end
end
