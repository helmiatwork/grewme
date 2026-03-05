# frozen_string_literal: true

module Types
  class RadarDataType < Types::BaseObject
    field :student_id, ID, null: false
    field :student_name, String, null: false
    field :skills, Types::RadarSkillType, null: false
  end
end
