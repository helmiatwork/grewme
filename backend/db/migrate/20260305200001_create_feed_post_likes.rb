class CreateFeedPostLikes < ActiveRecord::Migration[8.1]
  def change
    create_table :feed_post_likes do |t|
      t.references :feed_post, null: false, foreign_key: true
      t.string :liker_type, null: false
      t.bigint :liker_id, null: false
      t.timestamp :created_at, null: false
    end

    add_index :feed_post_likes, [ :feed_post_id, :liker_type, :liker_id ], unique: true, name: "idx_feed_post_likes_unique"
    add_index :feed_post_likes, [ :liker_type, :liker_id ]
  end
end
