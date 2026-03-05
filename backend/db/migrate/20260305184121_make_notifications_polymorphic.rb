# frozen_string_literal: true

class MakeNotificationsPolymorphic < ActiveRecord::Migration[8.1]
  def change
    safety_assured do
      remove_foreign_key :notifications, :feed_posts
      remove_index :notifications, :feed_post_id
      rename_column :notifications, :feed_post_id, :notifiable_id
      add_column :notifications, :notifiable_type, :string, null: false, default: "FeedPost"
      change_column_default :notifications, :notifiable_type, from: "FeedPost", to: nil
      add_index :notifications, [ :notifiable_type, :notifiable_id ]
    end
  end
end
