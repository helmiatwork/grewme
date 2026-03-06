class Avo::Resources::GroupConversation < Avo::BaseResource
  self.title = :id
  self.includes = [ :classroom ]

  def fields
    field :id, as: :id
    field :classroom, as: :belongs_to
    field :group_messages, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
