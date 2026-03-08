class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.string :event_type, null: false
      t.string :severity, null: false, default: "info"
      t.bigint :user_id
      t.string :user_type
      t.string :user_role
      t.string :resource_type
      t.bigint :resource_id
      t.string :action, null: false
      t.jsonb :metadata, default: {}
      t.inet :ip_address
      t.string :user_agent
      t.timestamps
    end

    add_index :audit_logs, :event_type
    add_index :audit_logs, [ :user_type, :user_id ]
    add_index :audit_logs, [ :resource_type, :resource_id ]
    add_index :audit_logs, :created_at
    add_index :audit_logs, :severity
  end
end
