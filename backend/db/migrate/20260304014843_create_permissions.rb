class CreatePermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :permissions do |t|
      t.string :permissionable_type, null: false
      t.bigint :permissionable_id, null: false
      t.string :resource, null: false
      t.string :action, null: false
      t.boolean :granted, null: false, default: true

      t.timestamps
    end

    add_index :permissions, [ :permissionable_type, :permissionable_id, :resource, :action ],
      unique: true, name: "index_permissions_on_permissionable_resource_action"
    add_index :permissions, [ :permissionable_type, :permissionable_id ],
      name: "index_permissions_on_permissionable"
  end
end
