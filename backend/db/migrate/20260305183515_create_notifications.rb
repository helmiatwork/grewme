# frozen_string_literal: true

class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :recipient, polymorphic: true, null: false
      t.references :feed_post, null: false, foreign_key: true
      t.string :title, null: false
      t.text :body, null: false
      t.datetime :read_at
      t.timestamps
    end

    add_index :notifications, [ :recipient_type, :recipient_id, :read_at ]
  end
end
