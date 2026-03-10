# frozen_string_literal: true

module Types
  class VariableInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :min, Integer, required: true
    argument :max, Integer, required: true
  end
end
