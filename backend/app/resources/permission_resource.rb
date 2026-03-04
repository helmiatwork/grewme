class PermissionResource
  include Alba::Resource

  root_key :permission
  attributes :id, :user_id, :resource, :action, :granted
end
