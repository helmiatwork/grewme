class Avo::Resources::Parent < Avo::BaseResource
  self.title = :name
  self.includes = []

  def fields
    field :id, as: :id
    field :name, as: :text
    field :email, as: :text
    field :phone, as: :text, hide_on: :index
    field :gender, as: :text, hide_on: :index
    field :qualification, as: :text, hide_on: :index
    field :bio, as: :textarea, hide_on: :index
    field :children, as: :has_many, through: :parent_students
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
