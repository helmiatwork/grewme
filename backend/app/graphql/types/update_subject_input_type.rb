# frozen_string_literal: true

module Types
  class UpdateSubjectInputType < Types::BaseInputObject
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :description, String, required: false
  end
end
