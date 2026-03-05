# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_05_200006) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key"
    t.bigint "owner_id"
    t.string "owner_type"
    t.text "parameters"
    t.bigint "recipient_id"
    t.string "recipient_type"
    t.bigint "trackable_id"
    t.string "trackable_type"
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_activities_on_created_at"
    t.index ["key"], name: "index_activities_on_key"
    t.index ["owner_type", "owner_id"], name: "index_activities_on_owner"
    t.index ["recipient_type", "recipient_id"], name: "index_activities_on_recipient"
    t.index ["trackable_type", "trackable_id"], name: "index_activities_on_trackable"
  end

  create_table "admin_users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_admin_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_admin_users_on_reset_password_token", unique: true
  end

  create_table "classroom_events", force: :cascade do |t|
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.bigint "creator_id", null: false
    t.string "creator_type", null: false
    t.text "description"
    t.time "end_time"
    t.date "event_date", null: false
    t.time "start_time"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id", "event_date"], name: "index_classroom_events_on_classroom_id_and_event_date"
    t.index ["classroom_id"], name: "index_classroom_events_on_classroom_id"
    t.index ["creator_type", "creator_id"], name: "index_classroom_events_on_creator_type_and_creator_id"
  end

  create_table "classroom_students", force: :cascade do |t|
    t.string "academic_year", null: false
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.date "enrolled_at", null: false
    t.date "left_at"
    t.integer "status", default: 0, null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id"], name: "index_classroom_students_on_classroom_id"
    t.index ["student_id", "status"], name: "index_classroom_students_on_student_active", unique: true, where: "(status = 0)"
    t.index ["student_id"], name: "index_classroom_students_on_student_id"
  end

  create_table "classroom_teachers", force: :cascade do |t|
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.string "role", default: "primary", null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id", "teacher_id"], name: "index_classroom_teachers_on_classroom_id_and_teacher_id", unique: true
    t.index ["classroom_id"], name: "index_classroom_teachers_on_classroom_id"
    t.index ["teacher_id"], name: "index_classroom_teachers_on_teacher_id"
  end

  create_table "classrooms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "school_id", null: false
    t.datetime "updated_at", null: false
    t.index ["school_id"], name: "index_classrooms_on_school_id"
  end

  create_table "daily_scores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.text "notes"
    t.integer "score", null: false
    t.integer "skill_category", null: false
    t.bigint "student_id", null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id", "date", "skill_category"], name: "idx_daily_scores_unique", unique: true
    t.index ["student_id"], name: "index_daily_scores_on_student_id"
    t.index ["teacher_id"], name: "index_daily_scores_on_teacher_id"
  end

  create_table "feed_post_comments", force: :cascade do |t|
    t.text "body", null: false
    t.bigint "commenter_id", null: false
    t.string "commenter_type", null: false
    t.datetime "created_at", null: false
    t.bigint "feed_post_id", null: false
    t.datetime "updated_at", null: false
    t.index ["feed_post_id", "created_at"], name: "index_feed_post_comments_on_feed_post_id_and_created_at"
    t.index ["feed_post_id"], name: "index_feed_post_comments_on_feed_post_id"
  end

  create_table "feed_post_likes", force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.bigint "feed_post_id", null: false
    t.bigint "liker_id", null: false
    t.string "liker_type", null: false
    t.index ["feed_post_id", "liker_type", "liker_id"], name: "idx_feed_post_likes_unique", unique: true
    t.index ["feed_post_id"], name: "index_feed_post_likes_on_feed_post_id"
    t.index ["liker_type", "liker_id"], name: "index_feed_post_likes_on_liker_type_and_liker_id"
  end

  create_table "feed_post_students", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "feed_post_id", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["feed_post_id", "student_id"], name: "index_feed_post_students_on_feed_post_id_and_student_id", unique: true
    t.index ["feed_post_id"], name: "index_feed_post_students_on_feed_post_id"
    t.index ["student_id"], name: "index_feed_post_students_on_student_id"
  end

  create_table "feed_posts", force: :cascade do |t|
    t.text "body", null: false
    t.bigint "classroom_id", null: false
    t.integer "comments_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "likes_count", default: 0, null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id", "created_at"], name: "index_feed_posts_on_classroom_id_and_created_at"
    t.index ["classroom_id"], name: "index_feed_posts_on_classroom_id"
    t.index ["teacher_id"], name: "index_feed_posts_on_teacher_id"
  end

  create_table "flipper_features", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_flipper_features_on_key", unique: true
  end

  create_table "flipper_gates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "feature_key", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.text "value"
    t.index ["feature_key", "key", "value"], name: "index_flipper_gates_on_feature_key_and_key_and_value", unique: true
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "notifications", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.bigint "notifiable_id", null: false
    t.string "notifiable_type", null: false
    t.datetime "read_at"
    t.bigint "recipient_id", null: false
    t.string "recipient_type", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["recipient_type", "recipient_id", "read_at"], name: "idx_on_recipient_type_recipient_id_read_at_50191a301d"
    t.index ["recipient_type", "recipient_id"], name: "index_notifications_on_recipient"
  end

  create_table "parent_students", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "parent_id", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id", "student_id"], name: "index_parent_students_on_parent_id_and_student_id", unique: true
    t.index ["parent_id"], name: "index_parent_students_on_parent_id"
    t.index ["student_id"], name: "index_parent_students_on_student_id"
  end

  create_table "parents", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.string "avatar"
    t.text "bio"
    t.date "birthdate"
    t.string "city"
    t.string "country_code", limit: 2
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "gender"
    t.string "name", null: false
    t.string "phone"
    t.string "postal_code"
    t.string "qualification"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "state_province"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_parents_on_email", unique: true
    t.index ["reset_password_token"], name: "index_parents_on_reset_password_token", unique: true
  end

  create_table "permissions", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.boolean "granted", default: true, null: false
    t.bigint "permissionable_id", null: false
    t.string "permissionable_type", null: false
    t.string "resource", null: false
    t.datetime "updated_at", null: false
    t.index ["permissionable_type", "permissionable_id", "resource", "action"], name: "index_permissions_on_permissionable_resource_action", unique: true
    t.index ["permissionable_type", "permissionable_id"], name: "index_permissions_on_permissionable"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.bigint "authenticatable_id", null: false
    t.string "authenticatable_type", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.index ["authenticatable_type", "authenticatable_id", "revoked_at"], name: "index_refresh_tokens_on_auth_revoked"
    t.index ["authenticatable_type", "authenticatable_id"], name: "index_refresh_tokens_on_authenticatable"
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
  end

  create_table "school_managers", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.text "bio"
    t.date "birthdate"
    t.string "city"
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "gender"
    t.string "name", null: false
    t.string "phone"
    t.string "postal_code"
    t.string "qualification"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.bigint "school_id", null: false
    t.string "state_province"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_school_managers_on_email", unique: true
    t.index ["reset_password_token"], name: "index_school_managers_on_reset_password_token", unique: true
    t.index ["school_id"], name: "index_school_managers_on_school_id"
  end

  create_table "schools", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.string "city"
    t.string "country_code", limit: 2
    t.datetime "created_at", null: false
    t.string "email"
    t.decimal "latitude", precision: 10, scale: 7
    t.decimal "longitude", precision: 10, scale: 7
    t.string "name", null: false
    t.string "phone"
    t.string "postal_code"
    t.string "state_province"
    t.datetime "updated_at", null: false
    t.string "website"
  end

  create_table "students", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.text "allergies"
    t.string "avatar"
    t.date "birthdate"
    t.string "blood_type"
    t.string "city"
    t.string "country_code", limit: 2
    t.datetime "created_at", null: false
    t.string "emergency_contact_name"
    t.string "emergency_contact_phone"
    t.string "gender"
    t.text "medical_notes"
    t.string "name", null: false
    t.string "postal_code"
    t.string "religion"
    t.string "state_province"
    t.string "student_id_number"
    t.datetime "updated_at", null: false
  end

  create_table "teachers", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.string "avatar"
    t.text "bio"
    t.date "birthdate"
    t.string "city"
    t.string "country_code", limit: 2
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "gender"
    t.string "name", null: false
    t.string "phone"
    t.string "postal_code"
    t.string "qualification"
    t.string "religion"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.bigint "school_id"
    t.string "state_province"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_teachers_on_email", unique: true
    t.index ["reset_password_token"], name: "index_teachers_on_reset_password_token", unique: true
    t.index ["school_id"], name: "index_teachers_on_school_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "classroom_events", "classrooms"
  add_foreign_key "classroom_students", "classrooms"
  add_foreign_key "classroom_students", "students"
  add_foreign_key "classroom_teachers", "classrooms"
  add_foreign_key "classroom_teachers", "teachers"
  add_foreign_key "classrooms", "schools"
  add_foreign_key "daily_scores", "students"
  add_foreign_key "daily_scores", "teachers"
  add_foreign_key "feed_post_comments", "feed_posts"
  add_foreign_key "feed_post_likes", "feed_posts"
  add_foreign_key "feed_post_students", "feed_posts"
  add_foreign_key "feed_post_students", "students"
  add_foreign_key "feed_posts", "classrooms"
  add_foreign_key "feed_posts", "teachers"
  add_foreign_key "parent_students", "parents"
  add_foreign_key "parent_students", "students"
  add_foreign_key "school_managers", "schools"
  add_foreign_key "teachers", "schools"

  create_view "student_radar_summaries", materialized: true, sql_definition: <<-SQL
      SELECT s.id AS student_id,
      s.name AS student_name,
      cs.classroom_id,
      avg(
          CASE
              WHEN (ds.skill_category = 0) THEN ds.score
              ELSE NULL::integer
          END) AS avg_reading,
      avg(
          CASE
              WHEN (ds.skill_category = 1) THEN ds.score
              ELSE NULL::integer
          END) AS avg_math,
      avg(
          CASE
              WHEN (ds.skill_category = 2) THEN ds.score
              ELSE NULL::integer
          END) AS avg_writing,
      avg(
          CASE
              WHEN (ds.skill_category = 3) THEN ds.score
              ELSE NULL::integer
          END) AS avg_logic,
      avg(
          CASE
              WHEN (ds.skill_category = 4) THEN ds.score
              ELSE NULL::integer
          END) AS avg_social,
      count(DISTINCT ds.date) AS total_days_scored,
      min(ds.date) AS first_score_date,
      max(ds.date) AS last_score_date
     FROM ((students s
       LEFT JOIN classroom_students cs ON (((cs.student_id = s.id) AND (cs.status = 0))))
       LEFT JOIN daily_scores ds ON ((ds.student_id = s.id)))
    GROUP BY s.id, s.name, cs.classroom_id;
  SQL
  add_index "student_radar_summaries", ["classroom_id"], name: "index_student_radar_summaries_on_classroom_id"
  add_index "student_radar_summaries", ["student_id"], name: "index_student_radar_summaries_on_student_id", unique: true

end
