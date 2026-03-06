class Avo::Resources::ExamSubmission < Avo::BaseResource
  self.title = :id
  self.includes = [ :student, :classroom_exam ]

  def fields
    field :id, as: :id
    field :status, as: :select, enum: ::ExamSubmission.statuses
    field :score, as: :number
    field :passed, as: :boolean
    field :started_at, as: :date_time, hide_on: :index
    field :submitted_at, as: :date_time, hide_on: :index
    field :graded_at, as: :date_time, hide_on: :index
    field :teacher_notes, as: :textarea, hide_on: :index
    field :student, as: :belongs_to
    field :classroom_exam, as: :belongs_to
    field :exam_answers, as: :has_many
    field :rubric_scores, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
