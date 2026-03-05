# frozen_string_literal: true

module Mutations
  class CreateFeedPost < BaseMutation
    argument :classroom_ids, [ ID ], required: true
    argument :body, String, required: true
    argument :signed_blob_ids, [ String ], required: false
    argument :student_ids, [ ID ], required: false

    field :feed_posts, [ Types::FeedPostType ]
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_ids:, body:, signed_blob_ids: [], student_ids: [])
      authenticate!
      raise Pundit::NotAuthorizedError unless current_user.teacher? || current_user.school_manager?

      classrooms = Classroom.where(id: classroom_ids)
      posts = []

      classrooms.each do |classroom|
        post = FeedPost.new(teacher: current_user, classroom: classroom, body: body)
        raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).create?

        unless post.save
          return {
            feed_posts: nil,
            errors: post.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
          }
        end

        attach_media(post, signed_blob_ids) if signed_blob_ids.present?
        tag_students(post, classroom, student_ids) if student_ids.present?
        create_notifications(post, classroom, student_ids)

        posts << post
      end

      { feed_posts: posts, errors: [] }
    end

    private

    def attach_media(post, signed_blob_ids)
      post.media.attach(signed_blob_ids.map { |id| ActiveStorage::Blob.find_signed!(id) })
    end

    def tag_students(post, classroom, student_ids)
      students = classroom.students
        .joins(:classroom_students)
        .where(classroom_students: { status: :active })
        .where(id: student_ids)
      post.tagged_students = students
    end

    def create_notifications(post, classroom, student_ids)
      teacher_name = current_user.name
      classroom_name = classroom.name

      if student_ids.present?
        # Notify only parents of tagged students
        parents = Parent.joins(:children)
          .where(students: { id: student_ids })
          .distinct

        parents.find_each do |parent|
          tagged_children = parent.children.where(id: student_ids).pluck(:name)
          notification = Notification.create!(
            recipient: parent,
            notifiable: post,
            title: "New post about #{tagged_children.to_sentence}",
            body: "#{teacher_name} posted in #{classroom_name}: #{post.body.truncate(100)}"
          )
          broadcast_notification(parent, notification)
        end
      else
        # Notify all parents with children in this classroom
        parents = Parent.joins(children: :classroom_students)
          .where(classroom_students: { classroom_id: classroom.id, status: :active })
          .distinct

        parents.find_each do |parent|
          notification = Notification.create!(
            recipient: parent,
            notifiable: post,
            title: "New post in #{classroom_name}",
            body: "#{teacher_name}: #{post.body.truncate(100)}"
          )
          broadcast_notification(parent, notification)
        end
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
