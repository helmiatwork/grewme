# frozen_string_literal: true

module Mutations
  class UpdateProfile < BaseMutation
    argument :name, String, required: false
    argument :email, String, required: false
    argument :phone, String, required: false
    argument :bio, String, required: false
    argument :birthdate, GraphQL::Types::ISO8601Date, required: false
    argument :gender, String, required: false
    argument :religion, String, required: false
    argument :qualification, String, required: false
    argument :address_line1, String, required: false
    argument :address_line2, String, required: false
    argument :city, String, required: false
    argument :state_province, String, required: false
    argument :postal_code, String, required: false
    argument :country_code, String, required: false
    argument :avatar_blob_id, String, required: false

    field :user, Types::UserUnion
    field :errors, [ Types::UserErrorType ], null: false

    PERMITTED_FIELDS = %i[
      name email phone bio birthdate gender qualification
      address_line1 address_line2 city state_province postal_code country_code
    ].freeze

    TEACHER_ONLY_FIELDS = %i[religion].freeze

    def resolve(**args)
      authenticate!

      attrs = args.slice(*PERMITTED_FIELDS)
      if current_user.teacher?
        attrs.merge!(args.slice(*TEACHER_ONLY_FIELDS))
      end
      attrs.compact!

      if args[:avatar_blob_id].present?
        blob = ActiveStorage::Blob.find_signed!(args[:avatar_blob_id])
        current_user.avatar_image.attach(blob)
      end

      if current_user.update(attrs)
        { user: current_user, errors: [] }
      else
        {
          user: nil,
          errors: current_user.errors.map { |e|
            { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] }
          }
        }
      end
    end
  end
end
