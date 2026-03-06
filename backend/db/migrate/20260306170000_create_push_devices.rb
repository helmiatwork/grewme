class CreatePushDevices < ActiveRecord::Migration[8.1]
  def change
    create_table :push_devices do |t|
      t.string :user_type, null: false
      t.bigint :user_id, null: false
      t.string :token, null: false
      t.string :platform, null: false  # android, ios, web
      t.boolean :active, default: true, null: false
      t.datetime :last_seen_at
      t.timestamps
    end

    add_index :push_devices, :token, unique: true
    add_index :push_devices, [ :user_type, :user_id ]
  end
end
