class Avo::Resources::ClassroomStudent < Avo::BaseResource
  self.title = :id
  self.includes = [ :student, :classroom ]

  def fields
    field :id, as: :id
    field :student, as: :belongs_to
    field :classroom, as: :belongs_to
    field :status, as: :select, enum: ::ClassroomStudent.statuses
    field :academic_year, as: :text
    field :enrolled_at, as: :date
    field :left_at, as: :date
    field :created_at, as: :date_time, sortable: true, readonly: true
    tool Avo::ResourceTools::ActivityTimeline, only_on: :show
  end
end
