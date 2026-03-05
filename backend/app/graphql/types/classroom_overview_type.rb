# frozen_string_literal: true

module Types
  class ClassroomOverviewType < Types::BaseObject
    field :classroom_id, ID, null: false
    field :classroom_name, String, null: false
    field :students, [ Types::RadarDataType ], null: false
  end
end
