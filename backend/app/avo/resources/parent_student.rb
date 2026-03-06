class Avo::Resources::ParentStudent < Avo::BaseResource
  self.title = :id
  self.includes = [ :parent, :student ]

  def fields
    field :id, as: :id
    field :parent, as: :belongs_to
    field :student, as: :belongs_to
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
