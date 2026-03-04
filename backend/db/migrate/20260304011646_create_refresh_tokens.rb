class CreateRefreshTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :refresh_tokens do |t|
      t.string :authenticatable_type, null: false
      t.bigint :authenticatable_id, null: false
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.string :ip_address
      t.string :user_agent

      t.timestamps
    end

    add_index :refresh_tokens, :token_digest, unique: true
    add_index :refresh_tokens, [ :authenticatable_type, :authenticatable_id ], name: "index_refresh_tokens_on_authenticatable"
    add_index :refresh_tokens, [ :authenticatable_type, :authenticatable_id, :revoked_at ], name: "index_refresh_tokens_on_auth_revoked"
  end
end
