class Avo::Resources::GroupMessage < Avo::BaseResource
  self.title = :id
  self.includes = [ :group_conversation ]

  def fields
    field :id, as: :id
    field :body, as: :textarea
    field :sender_type, as: :text
    field :sender_id, as: :number
    field :group_conversation, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
