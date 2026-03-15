module Mutations
  class AwardBehaviorPoint < BaseMutation
    argument :student_id, ID, required: true
    argument :classroom_id, ID, required: true
    argument :behavior_category_id, ID, required: true
    argument :note, String, required: false

    field :behavior_point, Types::BehaviorPointType
    field :daily_total, Integer, null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, classroom_id:, behavior_category_id:, note: nil)
      authenticate!

      category = BehaviorCategory.active.find(behavior_category_id)
      classroom = Classroom.find(classroom_id)
      student = Student.find(student_id)

      cache_key = "behavior_point:#{student_id}:#{behavior_category_id}"
      if Rails.cache.exist?(cache_key)
        return { behavior_point: nil, daily_total: 0, errors: [ { message: "Point already awarded recently. Wait before awarding again.", path: [ "behaviorCategoryId" ] } ] }
      end

      point = BehaviorPoint.new(
        student: student,
        teacher: current_user,
        classroom: classroom,
        behavior_category: category,
        point_value: category.point_value,
        note: note,
        awarded_at: Time.current
      )

      raise Pundit::NotAuthorizedError unless BehaviorPointPolicy.new(current_user, point).create?

      if point.save
        Rails.cache.write(cache_key, true, expires_in: 30.seconds)

        daily_total = BehaviorPoint.active.where(student_id: student_id, classroom_id: classroom_id)
          .for_date(Date.current).sum(:point_value)

        BehaviorChannel.broadcast_to(classroom, {
          type: "point_awarded",
          student_id: student.id,
          student_name: student.name,
          behavior_name: category.name,
          point_value: category.point_value,
          new_daily_total: daily_total,
          is_revocation: false
        })

        { behavior_point: point, daily_total: daily_total, errors: [] }
      else
        { behavior_point: nil, daily_total: 0, errors: point.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
