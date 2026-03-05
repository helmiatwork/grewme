class CreateSchoolManagers < ActiveRecord::Migration[8.1]
  def change
    create_table :school_managers do |t|
      # Profile
      t.string :name, null: false
      t.string :phone
      t.text :bio
      t.date :birthdate
      t.string :gender
      t.string :qualification
      # Address
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code
      # School
      t.references :school, null: false, foreign_key: true
      # Devise
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at

      t.timestamps
    end

    add_index :school_managers, :email, unique: true
    add_index :school_managers, :reset_password_token, unique: true
  end
end
