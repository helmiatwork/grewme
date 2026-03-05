# frozen_string_literal: true

module Types
  class UserUnion < Types::BaseUnion
    possible_types Types::TeacherType, Types::ParentType, Types::SchoolManagerType

    def self.resolve_type(object, context)
      case object
      when Teacher then Types::TeacherType
      when Parent then Types::ParentType
      when SchoolManager then Types::SchoolManagerType
      else
        raise GraphQL::ExecutionError, "Unknown user type: #{object.class}"
      end
    end
  end
end
