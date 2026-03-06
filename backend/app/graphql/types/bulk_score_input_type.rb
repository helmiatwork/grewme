# frozen_string_literal: true

module Types
  class BulkScoreInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :score, Integer, required: true
  end
end
