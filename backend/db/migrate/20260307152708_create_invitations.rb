class CreateInvitations < ActiveRecord::Migration[8.1]
  def change
    create_table :invitations do |t|
      t.string :inviter_type, null: false
      t.bigint :inviter_id, null: false
      t.references :school, null: false, foreign_key: true
      t.string :email, null: false
      t.string :role, null: false, default: "teacher"
      t.string :token, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :expires_at, null: false
      t.datetime :accepted_at
      t.timestamps
    end

    add_index :invitations, [ :inviter_type, :inviter_id ]
    add_index :invitations, :token, unique: true
    add_index :invitations, [ :email, :school_id ], unique: true, where: "status = 'pending'"
  end
end
