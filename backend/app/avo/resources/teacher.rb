class Avo::Resources::Teacher < Avo::BaseResource
  self.title = :name
  self.includes = [ :school, :classrooms ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :email, as: :text
    field :phone, as: :text, hide_on: :index
    field :gender, as: :text, hide_on: :index
    field :qualification, as: :text, hide_on: :index
    field :bio, as: :textarea, hide_on: :index
    field :school, as: :belongs_to
    field :classrooms, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
