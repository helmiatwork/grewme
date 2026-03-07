# frozen_string_literal: true

module Mutations
  class ExportChildData < BaseMutation
    argument :student_id, ID, required: true

    field :data, GraphQL::Types::JSON
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(student_id:)
      authenticate!
      unless current_user.parent?
        raise GraphQL::ExecutionError, "Only parents can export child data"
      end

      student = Student.find(student_id)

      # Verify parent has consent for this student
      unless current_user.children.include?(student)
        raise GraphQL::ExecutionError, "You do not have access to this student's data"
      end

      export = {
        student: {
          name: student.name,
          birthdate: student.birthdate,
          gender: student.gender
        },
        daily_scores: student.daily_scores.order(:date).map { |s|
          { date: s.date, skill_category: s.skill_category, score: s.score }
        },
        exam_submissions: student.exam_submissions.includes(classroom_exam: :exam).map { |es|
          { exam: es.classroom_exam&.exam&.title, score: es.score, submitted_at: es.created_at }
        },
        objective_masteries: student.objective_masteries.includes(:learning_objective).map { |om|
          { objective: om.learning_objective&.description, mastery_level: om.mastery_level, assessed_at: om.updated_at }
        },
        classrooms: student.classrooms.map { |c| { name: c.name } },
        exported_at: Time.current.iso8601
      }

      AuditLogger.log(
        event_type: :STUDENT_EXPORT,
        action: "export_child_data",
        user: current_user,
        resource: student,
        request: context[:request]
      )

      { data: export, errors: [] }
    end
  end
end
