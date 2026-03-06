class Avo::Resources::Classroom < Avo::BaseResource
  self.title = :name
  self.includes = [ :school, :classroom_teachers ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :grade, as: :number
    field :school, as: :belongs_to
    field :classroom_teachers, as: :has_many
    field :classroom_students, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
