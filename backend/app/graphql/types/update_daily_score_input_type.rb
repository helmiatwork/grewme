# frozen_string_literal: true

module Types
  class UpdateDailyScoreInputType < Types::BaseInputObject
    argument :score, Integer, required: false
    argument :notes, String, required: false
  end
end
