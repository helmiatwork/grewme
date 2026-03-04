class Avo::Resources::School < Avo::BaseResource
  self.title = :name
  self.includes = []

  def fields
    field :id, as: :id
    field :name, as: :text
    field :address_line1, as: :text, hide_on: :index
    field :address_line2, as: :text, hide_on: :index
    field :city, as: :text
    field :state_province, as: :text, hide_on: :index
    field :postal_code, as: :text, hide_on: :index
    field :country_code, as: :text
    field :phone, as: :text, hide_on: :index
    field :email, as: :text, hide_on: :index
    field :website, as: :text, hide_on: :index
    field :classrooms, as: :has_many
    field :teachers, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
    tool Avo::ResourceTools::ActivityTimeline, only_on: :show
  end
end
