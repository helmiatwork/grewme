# frozen_string_literal: true

module Mutations
  class RegisterSchoolManager < BaseMutation
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :school_name, String, required: true
    argument :min_grade, Integer, required: true
    argument :max_grade, Integer, required: true
    argument :address_line1, String, required: true
    argument :city, String, required: true
    argument :state_province, String, required: true
    argument :postal_code, String, required: true
    argument :country_code, String, required: true

    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :user, Types::UserUnion
    field :school, Types::SchoolType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(**args)
      school = nil
      manager = nil

      ActiveRecord::Base.transaction do
        school = School.new(
          name: args[:school_name],
          min_grade: args[:min_grade],
          max_grade: args[:max_grade],
          address_line1: args[:address_line1],
          city: args[:city],
          state_province: args[:state_province],
          postal_code: args[:postal_code],
          country_code: args[:country_code]
        )

        unless school.save
          return {
            errors: school.errors.map { |e| { message: e.full_message, path: [ "school#{e.attribute.to_s.camelize}" ] } }
          }
        end

        manager = SchoolManager.new(
          name: args[:name],
          email: args[:email],
          password: args[:password],
          password_confirmation: args[:password_confirmation],
          school: school
        )

        unless manager.save
          raise ActiveRecord::Rollback
        end
      end

      unless manager&.persisted?
        return {
          errors: manager&.errors&.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } || [ { message: "Registration failed", path: [ "base" ] } ]
        }
      end

      AuditLogger.log(
        event_type: :ACCOUNT_CREATED,
        action: "register_school_manager",
        user: manager,
        resource: school,
        request: context[:request]
      )

      access_token = generate_jwt_for(manager)
      refresh = manager.refresh_tokens.create!(
        ip_address: context[:request].remote_ip,
        user_agent: context[:request].user_agent
      )

      {
        access_token: access_token,
        refresh_token: refresh.raw_token,
        expires_in: jwt_expiration_time,
        user: manager,
        school: school,
        errors: []
      }
    end

    private

    def generate_jwt_for(entity)
      secret = Rails.application.credentials.devise_jwt_secret_key!
      payload = entity.jwt_payload.merge(
        "jti" => SecureRandom.uuid,
        "iat" => Time.current.to_i,
        "exp" => Devise::JWT.config.expiration_time.seconds.from_now.to_i
      )
      JWT.encode(payload, secret, "HS256")
    end

    def jwt_expiration_time
      Devise::JWT.config.expiration_time
    end
  end
end
