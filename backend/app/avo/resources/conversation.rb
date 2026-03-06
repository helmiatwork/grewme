class Avo::Resources::Conversation < Avo::BaseResource
  self.title = :id
  self.includes = [ :student, :parent, :teacher ]

  def fields
    field :id, as: :id
    field :student, as: :belongs_to
    field :parent, as: :belongs_to
    field :teacher, as: :belongs_to
    field :messages, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
