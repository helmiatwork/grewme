class CreateClassroomEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :classroom_events do |t|
      t.string :title, null: false
      t.text :description
      t.date :event_date, null: false
      t.time :start_time
      t.time :end_time
      t.references :classroom, null: false, foreign_key: true
      t.bigint :creator_id, null: false
      t.string :creator_type, null: false

      t.timestamps
    end

    add_index :classroom_events, [ :classroom_id, :event_date ]
    add_index :classroom_events, [ :creator_type, :creator_id ]
  end
end
