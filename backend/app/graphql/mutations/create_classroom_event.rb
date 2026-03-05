# frozen_string_literal: true

module Mutations
  class CreateClassroomEvent < BaseMutation
    argument :classroom_id, ID, required: true
    argument :title, String, required: true
    argument :description, String, required: false
    argument :event_date, GraphQL::Types::ISO8601Date, required: true
    argument :start_time, String, required: false
    argument :end_time, String, required: false

    field :classroom_event, Types::ClassroomEventType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:, title:, event_date:, description: nil, start_time: nil, end_time: nil)
      authenticate!

      classroom = Classroom.find(classroom_id)
      event = ClassroomEvent.new(
        classroom: classroom,
        creator: current_user,
        title: title,
        description: description,
        event_date: event_date,
        start_time: start_time.present? ? Time.zone.parse(start_time) : nil,
        end_time: end_time.present? ? Time.zone.parse(end_time) : nil
      )

      raise Pundit::NotAuthorizedError unless ClassroomEventPolicy.new(current_user, event).create?

      if event.save
        { classroom_event: event, errors: [] }
      else
        {
          classroom_event: nil,
          errors: event.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
