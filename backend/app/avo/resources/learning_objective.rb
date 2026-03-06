class Avo::Resources::LearningObjective < Avo::BaseResource
  self.title = :name
  self.includes = [ :topic ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :description, as: :textarea, hide_on: :index
    field :position, as: :number
    field :exam_pass_threshold, as: :number
    field :daily_score_threshold, as: :number
    field :topic, as: :belongs_to
    field :objective_masteries, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
