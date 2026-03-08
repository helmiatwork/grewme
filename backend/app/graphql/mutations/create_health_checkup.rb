# frozen_string_literal: true

module Mutations
  class CreateHealthCheckup < BaseMutation
    argument :student_id, ID, required: true
    argument :measured_at, GraphQL::Types::ISO8601Date, required: true
    argument :weight_kg, Float, required: false
    argument :height_cm, Float, required: false
    argument :head_circumference_cm, Float, required: false
    argument :notes, String, required: false

    field :health_checkup, Types::HealthCheckupType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:, measured_at:, weight_kg: nil, height_cm: nil, head_circumference_cm: nil, notes: nil)
      authenticate!

      unless current_user.is_a?(Teacher)
        raise GraphQL::ExecutionError, "Only teachers can record health checkups"
      end

      student = Student.find(student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

      checkup = HealthCheckup.new(
        student: student,
        teacher: current_user,
        measured_at: measured_at,
        weight_kg: weight_kg,
        height_cm: height_cm,
        head_circumference_cm: head_circumference_cm,
        notes: notes
      )

      if checkup.save
        AuditLogger.log(
          event_type: :HEALTH_CHECKUP_CREATE,
          action: "create_health_checkup",
          user: current_user,
          resource: checkup,
          request: context[:request]
        )
        { health_checkup: checkup, errors: [] }
      else
        {
          health_checkup: nil,
          errors: checkup.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } }
        }
      end
    end
  end
end
