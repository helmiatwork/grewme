# frozen_string_literal: true

module Types
  class ProgressDataType < Types::BaseObject
    field :weeks, [ Types::ProgressWeekType ], null: false
  end
end
