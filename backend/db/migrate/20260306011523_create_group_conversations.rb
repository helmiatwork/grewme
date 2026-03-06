class CreateGroupConversations < ActiveRecord::Migration[8.0]
  def change
    create_table :group_conversations do |t|
      t.references :classroom, null: false, foreign_key: true, index: { unique: true }
      t.timestamps
    end
  end
end
