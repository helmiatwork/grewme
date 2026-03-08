class CreateAccountDeletionRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :account_deletion_requests do |t|
      t.string :user_type, null: false
      t.bigint :user_id, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :grace_period_ends_at, null: false
      t.datetime :completed_at
      t.text :reason
      t.timestamps
    end

    add_index :account_deletion_requests, [ :user_type, :user_id ], unique: true, where: "status = 'pending'"
    add_index :account_deletion_requests, :status
    add_index :account_deletion_requests, :grace_period_ends_at
  end
end
