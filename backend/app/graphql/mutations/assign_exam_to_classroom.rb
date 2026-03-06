# frozen_string_literal: true

module Mutations
  class AssignExamToClassroom < BaseMutation
    argument :input, Types::AssignExamInputType, required: true

    field :classroom_exam, Types::ClassroomExamType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless ClassroomExamPolicy.new(current_user, ClassroomExam.new).create?

      classroom_exam = ClassroomExam.new(input.to_h)
      classroom_exam.assigned_by = current_user
      classroom_exam.status = :active

      if classroom_exam.save
        { classroom_exam: classroom_exam, errors: [] }
      else
        { classroom_exam: nil, errors: classroom_exam.errors.map { |e| { message: e.full_message, path: [ e.attribute.to_s.camelize(:lower) ] } } }
      end
    end
  end
end
