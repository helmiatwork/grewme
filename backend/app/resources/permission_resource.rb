class PermissionResource
  include Alba::Resource

  root_key :permission
  attributes :id, :permissionable_type, :permissionable_id, :resource, :action, :granted
end
