# frozen_string_literal: true

module Types
  class ClassroomEventType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String
    field :event_date, GraphQL::Types::ISO8601Date, null: false
    field :start_time, String
    field :end_time, String
    field :classroom, Types::ClassroomType, null: false
    field :creator_name, String, null: false
    field :creator_type, String, null: false
    field :is_mine, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def start_time
      object.start_time&.strftime("%H:%M")
    end

    def end_time
      object.end_time&.strftime("%H:%M")
    end

    def creator_name
      object.creator.name
    end

    def is_mine
      return false unless context[:current_user]
      object.creator_type == context[:current_user].class.name && object.creator_id == context[:current_user].id
    end
  end
end
