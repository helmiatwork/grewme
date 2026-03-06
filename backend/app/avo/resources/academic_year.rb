class Avo::Resources::AcademicYear < Avo::BaseResource
  self.title = :label
  self.includes = [ :school ]

  def fields
    field :id, as: :id
    field :label, as: :text
    field :start_date, as: :date
    field :end_date, as: :date
    field :current, as: :boolean
    field :school, as: :belongs_to
    field :grade_curriculums, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
