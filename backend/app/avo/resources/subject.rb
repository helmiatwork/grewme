class Avo::Resources::Subject < Avo::BaseResource
  self.title = :name
  self.includes = [ :school ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :description, as: :textarea, hide_on: :index
    field :school, as: :belongs_to
    field :topics, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
