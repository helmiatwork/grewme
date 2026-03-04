class CreatePermissions < ActiveRecord::Migration[8.1]
  def change
    create_table :permissions do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :resource, null: false
      t.string :action, null: false
      t.boolean :granted, null: false, default: true

      t.timestamps
    end

    add_index :permissions, [ :user_id, :resource, :action ], unique: true, name: "index_permissions_uniqueness"
  end
end
