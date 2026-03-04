class CreateStudents < ActiveRecord::Migration[8.1]
  def change
    create_table :students do |t|
      t.string :name, null: false
      t.string :avatar
      t.string :student_id_number
      t.date :birthdate
      t.string :gender
      t.string :religion
      t.string :blood_type
      t.text :allergies
      t.text :medical_notes
      t.string :emergency_contact_name
      t.string :emergency_contact_phone
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code, limit: 2

      t.timestamps
    end
  end
end
