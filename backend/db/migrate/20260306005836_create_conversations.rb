class CreateConversations < ActiveRecord::Migration[8.0]
  def change
    create_table :conversations do |t|
      t.references :student, null: false, foreign_key: true
      t.references :parent, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true
      t.timestamps
    end

    add_index :conversations, [ :student_id, :parent_id, :teacher_id ], unique: true, name: "idx_conversations_unique_trio"
  end
end
