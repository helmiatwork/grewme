# frozen_string_literal: true

module Mutations
  class SaveGradeCurriculum < BaseMutation
    argument :input, Types::SaveGradeCurriculumInputType, required: true

    field :grade_curriculum, Types::GradeCurriculumType
    field :errors, [ Types::UserErrorType ], null: false

    def resolve(input:)
      authenticate!
      raise Pundit::NotAuthorizedError unless GradeCurriculumPolicy.new(current_user, GradeCurriculum.new).create?

      academic_year = AcademicYear.find(input[:academic_year_id])
      gc = GradeCurriculum.find_or_initialize_by(academic_year: academic_year, grade: input[:grade])

      GradeCurriculum.transaction do
        gc.save! if gc.new_record?
        gc.grade_curriculum_items.destroy_all

        input[:items].each do |item_input|
          gc.grade_curriculum_items.create!(
            subject_id: item_input[:subject_id],
            topic_id: item_input[:topic_id],
            position: item_input[:position]
          )
        end
      end

      { grade_curriculum: gc.reload, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { grade_curriculum: nil, errors: [ { message: e.message, path: [ "base" ] } ] }
    end
  end
end
