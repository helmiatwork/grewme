module Permissionable
  extend ActiveSupport::Concern

  def has_permission?(resource, action)
    resource = resource.to_s
    action = action.to_s

    override = permissions.find_by(resource: resource, action: action)
    return override.granted? if override

    role_allows?(resource, action)
  end

  def role_allows?(resource, action)
    defaults = RolePermissions::DEFAULTS[role]
    return true if defaults == :all
    return false if defaults.nil?

    defaults.fetch(resource.to_s, []).include?(action.to_s)
  end

  def effective_permissions
    result = {}

    defaults = RolePermissions::DEFAULTS[role]
    if defaults == :all
      Permission::VALID_RESOURCES.each do |res|
        result[res] = Permission::VALID_ACTIONS.each_with_object({}) { |act, h| h[act] = true }
      end
    elsif defaults
      defaults.each do |res, actions|
        result[res] = actions.each_with_object({}) { |act, h| h[act] = true }
      end
    end

    permissions.find_each do |perm|
      result[perm.resource] ||= {}
      result[perm.resource][perm.action] = perm.granted?
    end

    result
  end
end
