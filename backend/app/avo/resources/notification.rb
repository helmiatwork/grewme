class Avo::Resources::Notification < Avo::BaseResource
  self.title = :title
  self.includes = []

  def fields
    field :id, as: :id
    field :title, as: :text
    field :body, as: :textarea
    field :recipient_type, as: :text
    field :recipient_id, as: :number
    field :notifiable_type, as: :text, hide_on: :index
    field :notifiable_id, as: :number, hide_on: :index
    field :read_at, as: :date_time
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
