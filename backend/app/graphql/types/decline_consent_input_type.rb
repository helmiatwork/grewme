# frozen_string_literal: true

module Types
  class DeclineConsentInputType < Types::BaseInputObject
    argument :token, String, required: true
  end
end
