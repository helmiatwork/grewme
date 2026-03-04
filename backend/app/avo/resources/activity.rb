class Avo::Resources::Activity < Avo::BaseResource
  self.title = :key
  self.includes = [ :trackable, :owner ]
  self.default_view_type = :table
  self.search = {
    query: -> {
      query.where("key LIKE ?", "%#{params[:q]}%")
        .or(query.where("trackable_type LIKE ?", "%#{params[:q]}%"))
    }
  }

  def fields
    field :id, as: :id
    field :key, as: :text, sortable: true
    field :trackable_type, as: :text, sortable: true, name: "Resource Type"
    field :trackable_id, as: :number, name: "Resource ID"
    field :owner_type, as: :text, hide_on: :index
    field :owner_id, as: :number, hide_on: :index
    field :parameters, as: :code, language: "json", hide_on: :index
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
