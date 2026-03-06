class Avo::Resources::RubricScore < Avo::BaseResource
  self.title = :id
  self.includes = [ :exam_submission, :rubric_criteria ]

  def fields
    field :id, as: :id
    field :score, as: :number
    field :feedback, as: :textarea, hide_on: :index
    field :exam_submission, as: :belongs_to
    field :rubric_criteria, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
