class Avo::Resources::RefreshToken < Avo::BaseResource
  self.title = :id
  self.includes = []

  def fields
    field :id, as: :id
    field :authenticatable_type, as: :text
    field :authenticatable_id, as: :number
    field :token_digest, as: :text, hide_on: :index
    field :expires_at, as: :date_time
    field :revoked_at, as: :date_time
    field :ip_address, as: :text, hide_on: :index
    field :user_agent, as: :text, hide_on: :index
    field :created_at, as: :date_time, sortable: true, readonly: true
  end
end
