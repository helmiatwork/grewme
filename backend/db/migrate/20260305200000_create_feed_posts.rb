class CreateFeedPosts < ActiveRecord::Migration[8.1]
  def change
    create_table :feed_posts do |t|
      t.references :teacher, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.text :body, null: false
      t.integer :likes_count, default: 0, null: false
      t.integer :comments_count, default: 0, null: false
      t.timestamps
    end

    add_index :feed_posts, [ :classroom_id, :created_at ]
  end
end
