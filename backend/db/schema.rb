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

ActiveRecord::Schema[8.1].define(version: 2026_03_04_014843) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "classrooms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "school_id", null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["school_id"], name: "index_classrooms_on_school_id"
    t.index ["teacher_id"], name: "index_classrooms_on_teacher_id"
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

  create_table "parent_students", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "parent_id", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id", "student_id"], name: "index_parent_students_on_parent_id_and_student_id", unique: true
    t.index ["parent_id"], name: "index_parent_students_on_parent_id"
    t.index ["student_id"], name: "index_parent_students_on_student_id"
  end

  create_table "permissions", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.boolean "granted", default: true, null: false
    t.string "resource", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "resource", "action"], name: "index_permissions_uniqueness", unique: true
    t.index ["user_id"], name: "index_permissions_on_user_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id", "revoked_at"], name: "index_refresh_tokens_on_user_id_and_revoked_at"
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "schools", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "students", force: :cascade do |t|
    t.string "avatar"
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["classroom_id"], name: "index_students_on_classroom_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "classrooms", "schools"
  add_foreign_key "classrooms", "users", column: "teacher_id"
  add_foreign_key "daily_scores", "students"
  add_foreign_key "daily_scores", "users", column: "teacher_id"
  add_foreign_key "parent_students", "students"
  add_foreign_key "parent_students", "users", column: "parent_id"
  add_foreign_key "permissions", "users", on_delete: :cascade
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "students", "classrooms"

  create_view "student_radar_summaries", materialized: true, sql_definition: <<-SQL
      SELECT s.id AS student_id,
      s.name AS student_name,
      s.classroom_id,
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
     FROM (students s
       LEFT JOIN daily_scores ds ON ((ds.student_id = s.id)))
    GROUP BY s.id, s.name, s.classroom_id;
  SQL
  add_index "student_radar_summaries", ["classroom_id"], name: "index_student_radar_summaries_on_classroom_id"
  add_index "student_radar_summaries", ["student_id"], name: "index_student_radar_summaries_on_student_id", unique: true

end
