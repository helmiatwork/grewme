class Avo::Resources::ClassroomTeacher < Avo::BaseResource
  self.title = :role
  self.includes = [ :classroom, :teacher ]

  def fields
    field :id, as: :id
    field :classroom, as: :belongs_to
    field :teacher, as: :belongs_to
    field :role, as: :select, options: { "Primary": "primary", "Assistant": "assistant", "Substitute": "substitute" }
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
