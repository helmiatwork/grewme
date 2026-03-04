class UserResource
  include Alba::Resource

  root_key :user
  attributes :id, :name, :email, :role
end
