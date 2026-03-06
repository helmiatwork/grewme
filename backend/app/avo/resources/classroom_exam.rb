class Avo::Resources::ClassroomExam < Avo::BaseResource
  self.title = :id
  self.includes = [ :exam, :classroom ]

  def fields
    field :id, as: :id
    field :status, as: :select, enum: ::ClassroomExam.statuses
    field :scheduled_at, as: :date_time
    field :due_at, as: :date_time
    field :assigned_by_type, as: :text, hide_on: :index
    field :assigned_by_id, as: :number, hide_on: :index
    field :exam, as: :belongs_to
    field :classroom, as: :belongs_to
    field :exam_submissions, as: :has_many
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
