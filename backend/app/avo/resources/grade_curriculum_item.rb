class Avo::Resources::GradeCurriculumItem < Avo::BaseResource
  self.title = :id
  self.includes = [ :grade_curriculum, :subject, :topic ]

  def fields
    field :id, as: :id
    field :position, as: :number
    field :grade_curriculum, as: :belongs_to
    field :subject, as: :belongs_to
    field :topic, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
