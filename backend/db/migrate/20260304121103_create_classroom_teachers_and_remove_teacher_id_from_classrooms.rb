class CreateClassroomTeachersAndRemoveTeacherIdFromClassrooms < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    safety_assured do
    create_table :classroom_teachers do |t|
      t.references :classroom, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true
      t.string :role, default: "primary", null: false
      t.timestamps
    end

    add_index :classroom_teachers, [ :classroom_id, :teacher_id ], unique: true

    # Migrate existing data: copy teacher_id from classrooms to classroom_teachers
    reversible do |dir|
      dir.up do
        execute <<-SQL
          INSERT INTO classroom_teachers (classroom_id, teacher_id, role, created_at, updated_at)
          SELECT id, teacher_id, 'primary', NOW(), NOW()
          FROM classrooms
          WHERE teacher_id IS NOT NULL
        SQL
      end
    end

    remove_foreign_key :classrooms, :teachers
    remove_index :classrooms, :teacher_id
    remove_column :classrooms, :teacher_id, :bigint
    end
  end
end
