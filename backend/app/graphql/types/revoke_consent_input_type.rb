# frozen_string_literal: true

module Types
  class RevokeConsentInputType < Types::BaseInputObject
    argument :id, ID, required: true
  end
end
