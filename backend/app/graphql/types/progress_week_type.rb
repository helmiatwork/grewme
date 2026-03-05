# frozen_string_literal: true

module Types
  class ProgressWeekType < Types::BaseObject
    field :period, String, null: false
    field :skills, Types::RadarSkillType, null: false
  end
end
