class Avo::Resources::ObjectiveMastery < Avo::BaseResource
  self.title = :id
  self.includes = [ :student, :learning_objective ]

  def fields
    field :id, as: :id
    field :exam_mastered, as: :boolean
    field :daily_mastered, as: :boolean
    field :mastered_at, as: :date_time
    field :student, as: :belongs_to
    field :learning_objective, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
