# frozen_string_literal: true

module Mutations
  class CreateFeedPost < BaseMutation
    argument :classroom_id, ID, required: true
    argument :body, String, required: true
    argument :signed_blob_ids, [ String ], required: false
    argument :student_ids, [ ID ], required: false

    field :feed_post, Types::FeedPostType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(classroom_id:, body:, signed_blob_ids: [], student_ids: [])
      authenticate!
      raise Pundit::NotAuthorizedError unless current_user.teacher?

      classroom = Classroom.find(classroom_id)
      post = FeedPost.new(teacher: current_user, classroom: classroom, body: body)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).create?

      if post.save
        if signed_blob_ids.present?
          post.media.attach(signed_blob_ids.map { |id| ActiveStorage::Blob.find_signed!(id) })
        end
        if student_ids.present?
          students = classroom.students
            .joins(:classroom_students)
            .where(classroom_students: { status: :active })
            .where(id: student_ids)
          post.tagged_students = students
        end
        { feed_post: post, errors: [] }
      else
        { feed_post: nil, errors: post.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
