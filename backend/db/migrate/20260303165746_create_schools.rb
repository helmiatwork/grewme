class CreateSchools < ActiveRecord::Migration[8.1]
  def change
    create_table :schools do |t|
      t.string :name, null: false
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :state_province
      t.string :postal_code
      t.string :country_code, limit: 2
      t.decimal :latitude, precision: 10, scale: 7
      t.decimal :longitude, precision: 10, scale: 7
      t.string :phone
      t.string :email
      t.string :website

      t.timestamps
    end
  end
end
