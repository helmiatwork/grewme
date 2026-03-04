class Avo::Resources::Student < Avo::BaseResource
  self.title = :name
  self.includes = []

  def fields
    field :id, as: :id
    field :name, as: :text
    field :student_id_number, as: :text, hide_on: :index
    field :birthdate, as: :date, hide_on: :index
    field :gender, as: :text, hide_on: :index
    field :blood_type, as: :text, hide_on: :index
    field :allergies, as: :text, hide_on: :index
    field :medical_notes, as: :textarea, hide_on: :index
    field :emergency_contact_name, as: :text, hide_on: :index
    field :emergency_contact_phone, as: :text, hide_on: :index
    field :classroom_students, as: :has_many
    field :daily_scores, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
    tool Avo::ResourceTools::ActivityTimeline, only_on: :show
  end
end
