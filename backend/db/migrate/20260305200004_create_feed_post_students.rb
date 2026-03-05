class CreateFeedPostStudents < ActiveRecord::Migration[8.0]
  def change
    create_table :feed_post_students do |t|
      t.references :feed_post, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.timestamps
    end

    add_index :feed_post_students, [ :feed_post_id, :student_id ], unique: true
  end
end
