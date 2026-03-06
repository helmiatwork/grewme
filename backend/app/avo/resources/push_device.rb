class Avo::Resources::PushDevice < Avo::BaseResource
  self.title = :id
  self.includes = []

  def fields
    field :id, as: :id
    field :token, as: :text
    field :platform, as: :select, options: { android: "android", ios: "ios", web: "web" }
    field :active, as: :boolean
    field :user_type, as: :text
    field :user_id, as: :number
    field :last_seen_at, as: :date_time, hide_on: :index
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
