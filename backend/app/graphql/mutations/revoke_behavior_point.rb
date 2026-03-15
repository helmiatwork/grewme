module Mutations
  class RevokeBehaviorPoint < BaseMutation
    argument :id, ID, required: true

    field :behavior_point, Types::BehaviorPointType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(id:)
      authenticate!

      point = BehaviorPoint.find(id)
      raise Pundit::NotAuthorizedError unless BehaviorPointPolicy.new(current_user, point).revoke?

      point.revoke!

      daily_total = BehaviorPoint.active.where(student_id: point.student_id, classroom_id: point.classroom_id)
        .for_date(Date.current).sum(:point_value)

      BehaviorChannel.broadcast_to(point.classroom, {
        type: "point_revoked",
        student_id: point.student_id,
        student_name: point.student.name,
        behavior_name: point.behavior_category.name,
        point_value: point.point_value,
        new_daily_total: daily_total,
        is_revocation: true
      })

      { behavior_point: point, errors: [] }
    rescue RuntimeError => e
      { behavior_point: nil, errors: [ { message: e.message, path: [ "id" ] } ] }
    end
  end
end
