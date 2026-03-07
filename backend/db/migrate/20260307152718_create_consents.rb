class CreateConsents < ActiveRecord::Migration[8.1]
  def change
    create_table :consents do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, null: true, foreign_key: { to_table: :parents }
      t.string :parent_email, null: false
      t.string :status, null: false, default: "pending"
      t.string :consent_method, null: false, default: "email_plus"
      t.string :token, null: false
      t.text :ip_address
      t.datetime :granted_at
      t.datetime :revoked_at
      t.datetime :expires_at
      t.string :notice_content_hash
      t.timestamps
    end

    add_index :consents, :token, unique: true
    add_index :consents, [ :student_id, :parent_email ], unique: true
    add_index :consents, :status
  end
end
