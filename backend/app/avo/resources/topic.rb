class Avo::Resources::Topic < Avo::BaseResource
  self.title = :name
  self.includes = [ :subject ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :description, as: :textarea, hide_on: :index
    field :position, as: :number
    field :subject, as: :belongs_to
    field :learning_objectives, as: :has_many
    field :exams, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
