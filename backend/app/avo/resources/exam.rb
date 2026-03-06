class Avo::Resources::Exam < Avo::BaseResource
  self.title = :title
  self.includes = [ :topic ]

  def fields
    field :id, as: :id
    field :title, as: :text
    field :description, as: :textarea, hide_on: :index
    field :exam_type, as: :select, enum: ::Exam.exam_types
    field :max_score, as: :number
    field :duration_minutes, as: :number
    field :created_by_type, as: :text, hide_on: :index
    field :created_by_id, as: :number, hide_on: :index
    field :topic, as: :belongs_to
    field :exam_questions, as: :has_many
    field :rubric_criteria, as: :has_many
    field :classroom_exams, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
