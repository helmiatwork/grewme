class Avo::Resources::GradeCurriculum < Avo::BaseResource
  self.title = :grade
  self.includes = [ :academic_year ]

  def fields
    field :id, as: :id
    field :grade, as: :number
    field :academic_year, as: :belongs_to
    field :grade_curriculum_items, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
