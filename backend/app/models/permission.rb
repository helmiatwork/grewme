class Permission < ApplicationRecord
  belongs_to :permissionable, polymorphic: true

  VALID_RESOURCES = %w[classrooms students daily_scores children].freeze
  VALID_ACTIONS = %w[index show create update destroy overview radar progress].freeze

  validates :resource, presence: true, inclusion: { in: VALID_RESOURCES }
  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
  validates :action, uniqueness: { scope: [ :permissionable_type, :permissionable_id, :resource ], message: "already exists for this user and resource" }

  scope :for_resource, ->(resource) { where(resource: resource) }
  scope :grants, -> { where(granted: true) }
  scope :revocations, -> { where(granted: false) }
end
