class Avo::Resources::ClassroomEvent < Avo::BaseResource
  self.title = :title
  self.includes = [ :classroom ]

  def fields
    field :id, as: :id
    field :title, as: :text
    field :description, as: :textarea, hide_on: :index
    field :event_date, as: :date, sortable: true
    field :start_time, as: :text, hide_on: :index
    field :end_time, as: :text, hide_on: :index
    field :creator_type, as: :text, hide_on: :index
    field :creator_id, as: :number, hide_on: :index
    field :classroom, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
