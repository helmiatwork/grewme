class Avo::Resources::RubricCriteria < Avo::BaseResource
  self.title = :name
  self.includes = [ :exam ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :description, as: :textarea, hide_on: :index
    field :max_score, as: :number
    field :position, as: :number
    field :exam, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
