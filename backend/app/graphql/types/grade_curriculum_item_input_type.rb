# frozen_string_literal: true

module Types
  class GradeCurriculumItemInputType < Types::BaseInputObject
    argument :subject_id, ID, required: false
    argument :topic_id, ID, required: false
    argument :position, Integer, required: true
  end
end
