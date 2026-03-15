module Mutations
  class BatchAwardBehaviorPoints < BaseMutation
    argument :student_ids, [ ID ], required: true
    argument :classroom_id, ID, required: true
    argument :behavior_category_id, ID, required: true
    argument :note, String, required: false

    field :behavior_points, [ Types::BehaviorPointType ], null: false
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_ids:, classroom_id:, behavior_category_id:, note: nil)
      authenticate!

      category = BehaviorCategory.active.find(behavior_category_id)
      classroom = Classroom.find(classroom_id)
      created = []
      all_errors = []

      student_ids.each do |sid|
        student = Student.find(sid)
        point = BehaviorPoint.new(
          student: student,
          teacher: current_user,
          classroom: classroom,
          behavior_category: category,
          point_value: category.point_value,
          note: note,
          awarded_at: Time.current
        )

        unless BehaviorPointPolicy.new(current_user, point).create?
          all_errors << { message: "Not authorized for student #{student.name}", path: [ sid ] }
          next
        end

        if point.save
          created << point
        else
          point.errors.each do |e|
            all_errors << { message: "#{student.name}: #{e.full_message}", path: [ sid ] }
          end
        end
      end

      if created.any?
        BehaviorChannel.broadcast_to(classroom, {
          type: "batch_awarded",
          awards: created.map do |p|
            daily_total = BehaviorPoint.active.where(student_id: p.student_id, classroom_id: classroom_id)
              .for_date(Date.current).sum(:point_value)
            {
              student_id: p.student_id,
              student_name: p.student.name,
              behavior_name: category.name,
              point_value: category.point_value,
              new_daily_total: daily_total
            }
          end
        })
      end

      { behavior_points: created, errors: all_errors }
    end
  end
end
