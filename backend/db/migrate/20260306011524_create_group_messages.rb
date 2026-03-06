class CreateGroupMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :group_messages do |t|
      t.references :group_conversation, null: false, foreign_key: true
      t.references :sender, polymorphic: true, null: false
      t.text :body, null: false
      t.timestamps
    end

    add_index :group_messages, [ :group_conversation_id, :created_at ]
  end
end
