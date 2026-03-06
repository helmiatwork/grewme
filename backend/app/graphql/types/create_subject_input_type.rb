# frozen_string_literal: true

module Types
  class CreateSubjectInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :description, String, required: false
    argument :school_id, ID, required: true
  end
end
