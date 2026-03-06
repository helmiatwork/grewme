# frozen_string_literal: true

module Types
  class UpdateTopicInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
    argument :position, Integer, required: false
  end
end
