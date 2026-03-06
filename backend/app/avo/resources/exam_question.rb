class Avo::Resources::ExamQuestion < Avo::BaseResource
  self.title = :question_text
  self.includes = [ :exam ]

  def fields
    field :id, as: :id
    field :question_text, as: :textarea
    field :correct_answer, as: :text
    field :options, as: :code, language: "json", hide_on: :index
    field :points, as: :number
    field :position, as: :number
    field :exam, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
