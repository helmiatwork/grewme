# frozen_string_literal: true

module Types
  class RequestConsentInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :parent_email, String, required: true
  end
end
