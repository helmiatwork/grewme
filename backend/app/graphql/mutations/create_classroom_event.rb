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
        notify_about_event(event, classroom)
        { classroom_event: event, errors: [] }
      else
        {
          classroom_event: nil,
          errors: event.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end

    private

    def notify_about_event(event, classroom)
      creator_name = current_user.name
      classroom_name = classroom.name
      event_title = event.title
      event_date = event.event_date.strftime("%B %d, %Y")

      # Notify all teachers in the classroom (except the creator)
      classroom.teachers.where.not(id: current_user.id).find_each do |teacher|
        notification = Notification.create!(
          recipient: teacher,
          notifiable: event,
          title: "New event: #{event_title}",
          body: "#{creator_name} added \"#{event_title}\" on #{event_date} in #{classroom_name}"
        )
        broadcast_notification(teacher, notification)
      end

      # Notify all parents with children in this classroom
      parents = Parent.joins(children: :classroom_students)
        .where(classroom_students: { classroom_id: classroom.id, status: :active })
        .distinct

      parents.find_each do |parent|
        notification = Notification.create!(
          recipient: parent,
          notifiable: event,
          title: "New event: #{event_title}",
          body: "#{event_title} on #{event_date} in #{classroom_name}"
        )
        broadcast_notification(parent, notification)
      end
    end

    def broadcast_notification(recipient, notification)
      NotificationsChannel.broadcast_to(recipient, {
        type: "new_notification",
        notification: {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          notifiable_type: notification.notifiable_type,
          notifiable_id: notification.notifiable_id,
          created_at: notification.created_at.iso8601
        }
      })
    end
  end
end
