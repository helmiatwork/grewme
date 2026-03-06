# frozen_string_literal: true

module Mutations
  class CreateExam < BaseMutation
    argument :input, Types::CreateExamInputType, required: true

    field :exam, Types::ExamObjectType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless ExamPolicy.new(current_user, Exam.new).create?

      attrs = input.to_h.except(:questions, :rubric_criteria)
      exam = Exam.new(attrs)
      exam.created_by = current_user

      ActiveRecord::Base.transaction do
        exam.save!

        if input.questions.present?
          input.questions.each_with_index do |q, i|
            exam.exam_questions.create!(q.to_h.merge(position: q.position || i))
          end
        end

        if input.rubric_criteria.present?
          input.rubric_criteria.each_with_index do |rc, i|
            exam.rubric_criteria.create!(rc.to_h.merge(position: rc.position || i))
          end
        end
      end

      { exam: exam, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { exam: nil, errors: e.record.errors.map { |err| { message: err.full_message, path: [ err.attribute.to_s.camelize(:lower) ] } } }
    end
  end
end
