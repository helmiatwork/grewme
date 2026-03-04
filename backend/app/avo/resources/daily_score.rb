class Avo::Resources::DailyScore < Avo::BaseResource
  self.title = :id
  self.includes = [ :student, :teacher ]

  def fields
    field :id, as: :id
    field :student, as: :belongs_to
    field :teacher, as: :belongs_to
    field :date, as: :date, sortable: true
    field :skill_category, as: :select, enum: ::DailyScore.skill_categories
    field :score, as: :number
    field :notes, as: :textarea, hide_on: :index
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
