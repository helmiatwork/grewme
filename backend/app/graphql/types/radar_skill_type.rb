# frozen_string_literal: true

module Types
  class RadarSkillType < Types::BaseObject
    field :reading, Float
    field :math, Float
    field :writing, Float
    field :logic, Float
    field :social, Float
  end
end
