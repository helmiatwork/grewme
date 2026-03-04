class Avo::Resources::Classroom < Avo::BaseResource
  self.title = :name
  self.includes = [ :school, :teacher ]

  def fields
    field :id, as: :id
    field :name, as: :text
    field :school, as: :belongs_to
    field :teacher, as: :belongs_to
    field :classroom_students, as: :has_many
     field :created_at, as: :date_time, sortable: true, readonly: true
   end
end
