# frozen_string_literal: true

module Types
  class SaveGradeCurriculumInputType < Types::BaseInputObject
    argument :academic_year_id, ID, required: true
    argument :grade, Integer, required: true
    argument :items, [ Types::GradeCurriculumItemInputType ], required: true
  end
end
