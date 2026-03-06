class Avo::Resources::ExamAnswer < Avo::BaseResource
  self.title = :id
  self.includes = [ :exam_submission, :exam_question ]

  def fields
    field :id, as: :id
    field :selected_answer, as: :text
    field :correct, as: :boolean
    field :points_awarded, as: :number
    field :exam_submission, as: :belongs_to
    field :exam_question, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
