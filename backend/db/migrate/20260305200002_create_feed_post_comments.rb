class CreateFeedPostComments < ActiveRecord::Migration[8.1]
  def change
    create_table :feed_post_comments do |t|
      t.references :feed_post, null: false, foreign_key: true
      t.string :commenter_type, null: false
      t.bigint :commenter_id, null: false
      t.text :body, null: false
      t.timestamps
    end

    add_index :feed_post_comments, [ :feed_post_id, :created_at ]
  end
end
