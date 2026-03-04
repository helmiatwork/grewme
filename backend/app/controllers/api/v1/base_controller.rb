module Api
  module V1
    class BaseController < ApplicationController
      include Pundit::Authorization

      rescue_from Pundit::NotAuthorizedError do
        render json: { error: { code: "forbidden", message: "You don't have permission to access this resource" } }, status: :forbidden
      end

      rescue_from ApiError::Base do |e|
        render json: { error: { code: e.code, message: e.message } }, status: e.status
      end

      rescue_from ActiveRecord::RecordNotFound do |e|
        render json: { error: { code: "not_found", message: "#{e.model} not found" } }, status: :not_found
      end

      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { error: { code: "validation_failed", message: e.message, details: e.record.errors } }, status: :unprocessable_entity
      end

      rescue_from ActionController::ParameterMissing do |e|
        render json: { error: { code: "missing_parameter", message: e.message } }, status: :bad_request
      end

      private

      def render_error(message, status: :unprocessable_entity, code: nil)
        render json: { error: { code: code || status.to_s, message: message } }, status: status
      end
    end
  end
end
