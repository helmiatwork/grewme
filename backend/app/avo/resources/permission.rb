class Avo::Resources::Permission < Avo::BaseResource
  self.title = :id
  self.includes = []

  def fields
    field :id, as: :id
    field :permissionable_type, as: :text
    field :permissionable_id, as: :number
    field :resource, as: :text
    field :action, as: :text
    field :granted, as: :boolean
     field :created_at, as: :date_time, sortable: true, readonly: true
   end
end
