class Avo::Resources::Message < Avo::BaseResource
  self.title = :id
  self.includes = [ :conversation ]

  def fields
    field :id, as: :id
    field :body, as: :textarea
    field :sender_type, as: :text
    field :sender_id, as: :number
    field :read_at, as: :date_time
    field :conversation, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
