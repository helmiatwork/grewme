# frozen_string_literal: true

class CreateActivities < ActiveRecord::Migration[8.1]
  def change
    create_table :activities do |t|
      t.belongs_to :trackable, polymorphic: true, index: true
      t.belongs_to :owner, polymorphic: true, index: true
      t.belongs_to :recipient, polymorphic: true, index: true
      t.string :key, index: true
      t.text :parameters

      t.timestamps
    end

    add_index :activities, :created_at
  end
end
