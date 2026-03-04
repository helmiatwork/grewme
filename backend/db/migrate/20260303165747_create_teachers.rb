class CreateTeachers < ActiveRecord::Migration[8.1]
  def change
    create_table :teachers do |t|
      ## Database authenticatable
      t.string :name, null: false
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Profile fields
      t.references :school, foreign_key: true
      t.date :birthdate
      t.string :phone
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code, limit: 2
      t.string :avatar
      t.string :gender
      t.string :religion
      t.string :qualification
      t.text :bio

      t.timestamps
    end

    add_index :teachers, :email, unique: true
    add_index :teachers, :reset_password_token, unique: true
  end
end
