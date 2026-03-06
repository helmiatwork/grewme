# frozen_string_literal: true

module Types
  class CreateTopicInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :subject_id, ID, required: true
    argument :position, Integer, required: false
  end
end
