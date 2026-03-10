class AddKindAndParamsToNotifications < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_column :notifications, :kind, :string
    add_column :notifications, :params, :jsonb, default: {}
    add_index :notifications, :kind, algorithm: :concurrently
  end
end
