class Avo::Resources::SchoolManager < Avo::BaseResource
  self.title = :name
  self.includes = [ :school ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :email, as: :text
    field :phone, as: :text, hide_on: :index
    field :gender, as: :text, hide_on: :index
    field :qualification, as: :text, hide_on: :index
    field :bio, as: :textarea, hide_on: :index
    field :birthdate, as: :date, hide_on: :index
    field :address_line1, as: :text, hide_on: :index
    field :address_line2, as: :text, hide_on: :index
    field :city, as: :text, hide_on: :index
    field :state_province, as: :text, hide_on: :index
    field :postal_code, as: :text, hide_on: :index
    field :country_code, as: :text, hide_on: :index
    field :school, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
