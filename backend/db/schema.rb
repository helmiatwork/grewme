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

ActiveRecord::Schema[8.1].define(version: 2026_03_10_115453) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "academic_years", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "current", default: false, null: false
    t.date "end_date", null: false
    t.string "label", null: false
    t.bigint "school_id", null: false
    t.date "start_date", null: false
    t.datetime "updated_at", null: false
    t.index ["school_id", "label"], name: "index_academic_years_on_school_id_and_label", unique: true
    t.index ["school_id"], name: "index_academic_years_on_school_id"
  end

  create_table "account_deletion_requests", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "grace_period_ends_at", null: false
    t.text "reason"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "user_type", null: false
    t.index ["grace_period_ends_at"], name: "index_account_deletion_requests_on_grace_period_ends_at"
    t.index ["status"], name: "index_account_deletion_requests_on_status"
    t.index ["user_type", "user_id"], name: "index_account_deletion_requests_on_user_type_and_user_id", unique: true, where: "((status)::text = 'pending'::text)"
  end

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

  create_table "attendances", force: :cascade do |t|
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.bigint "leave_request_id"
    t.text "notes"
    t.bigint "recorded_by_id"
    t.string "recorded_by_type"
    t.integer "status", default: 0, null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id", "date"], name: "index_attendances_on_classroom_id_and_date"
    t.index ["classroom_id"], name: "index_attendances_on_classroom_id"
    t.index ["leave_request_id"], name: "index_attendances_on_leave_request_id"
    t.index ["recorded_by_type", "recorded_by_id"], name: "index_attendances_on_recorded_by_type_and_recorded_by_id"
    t.index ["student_id", "classroom_id", "date"], name: "idx_attendances_unique", unique: true
    t.index ["student_id"], name: "index_attendances_on_student_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.string "event_type", null: false
    t.inet "ip_address"
    t.jsonb "metadata", default: {}
    t.bigint "resource_id"
    t.string "resource_type"
    t.string "severity", default: "info", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id"
    t.string "user_role"
    t.string "user_type"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["event_type"], name: "index_audit_logs_on_event_type"
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
    t.index ["severity"], name: "index_audit_logs_on_severity"
    t.index ["user_type", "user_id"], name: "index_audit_logs_on_user_type_and_user_id"
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

  create_table "classroom_exams", force: :cascade do |t|
    t.string "access_code", limit: 6
    t.bigint "assigned_by_id", null: false
    t.string "assigned_by_type", null: false
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.datetime "due_at"
    t.integer "duration_minutes"
    t.bigint "exam_id", null: false
    t.datetime "scheduled_at"
    t.boolean "show_results", default: false, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["access_code"], name: "index_classroom_exams_on_access_code", unique: true
    t.index ["assigned_by_type", "assigned_by_id"], name: "index_classroom_exams_on_assigned_by"
    t.index ["classroom_id", "exam_id"], name: "index_classroom_exams_on_classroom_id_and_exam_id", unique: true
    t.index ["classroom_id", "status"], name: "index_classroom_exams_on_classroom_id_and_status"
    t.index ["classroom_id"], name: "index_classroom_exams_on_classroom_id"
    t.index ["exam_id"], name: "index_classroom_exams_on_exam_id"
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
    t.integer "grade"
    t.string "name", null: false
    t.bigint "school_id", null: false
    t.datetime "updated_at", null: false
    t.index ["school_id"], name: "index_classrooms_on_school_id"
  end

  create_table "consents", force: :cascade do |t|
    t.string "consent_method", default: "email_plus", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.datetime "granted_at"
    t.text "ip_address"
    t.string "notice_content_hash"
    t.string "parent_email", null: false
    t.bigint "parent_id"
    t.datetime "revoked_at"
    t.string "status", default: "pending", null: false
    t.bigint "student_id", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_consents_on_parent_id"
    t.index ["status"], name: "index_consents_on_status"
    t.index ["student_id", "parent_email"], name: "index_consents_on_student_id_and_parent_email", unique: true
    t.index ["student_id"], name: "index_consents_on_student_id"
    t.index ["token"], name: "index_consents_on_token", unique: true
  end

  create_table "conversations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "parent_id", null: false
    t.bigint "student_id", null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_conversations_on_parent_id"
    t.index ["student_id", "parent_id", "teacher_id"], name: "idx_conversations_unique_trio", unique: true
    t.index ["student_id"], name: "index_conversations_on_student_id"
    t.index ["teacher_id"], name: "index_conversations_on_teacher_id"
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

  create_table "exam_answers", force: :cascade do |t|
    t.boolean "correct"
    t.datetime "created_at", null: false
    t.bigint "exam_question_id", null: false
    t.bigint "exam_submission_id", null: false
    t.integer "points_awarded", default: 0
    t.string "selected_answer"
    t.bigint "student_question_id"
    t.datetime "updated_at", null: false
    t.index ["exam_question_id"], name: "index_exam_answers_on_exam_question_id"
    t.index ["exam_submission_id", "exam_question_id"], name: "index_exam_answers_on_exam_submission_id_and_exam_question_id", unique: true
    t.index ["exam_submission_id"], name: "index_exam_answers_on_exam_submission_id"
    t.index ["student_question_id"], name: "index_exam_answers_on_student_question_id"
  end

  create_table "exam_questions", force: :cascade do |t|
    t.string "correct_answer"
    t.datetime "created_at", null: false
    t.bigint "exam_id", null: false
    t.jsonb "fixed_values", default: {}
    t.string "formula"
    t.jsonb "options", default: []
    t.boolean "parameterized", default: false, null: false
    t.integer "points", default: 1, null: false
    t.integer "position", default: 0, null: false
    t.text "question_text"
    t.string "template_text"
    t.datetime "updated_at", null: false
    t.integer "value_mode", default: 0
    t.jsonb "variables", default: []
    t.index ["exam_id", "position"], name: "index_exam_questions_on_exam_id_and_position"
    t.index ["exam_id"], name: "index_exam_questions_on_exam_id"
  end

  create_table "exam_submissions", force: :cascade do |t|
    t.boolean "auto_submitted", default: false, null: false
    t.bigint "classroom_exam_id", null: false
    t.datetime "created_at", null: false
    t.datetime "graded_at"
    t.boolean "passed"
    t.decimal "score", precision: 5, scale: 2
    t.string "session_token"
    t.datetime "started_at"
    t.integer "status", default: 0, null: false
    t.bigint "student_id", null: false
    t.datetime "submitted_at"
    t.text "teacher_notes"
    t.datetime "updated_at", null: false
    t.index ["classroom_exam_id"], name: "index_exam_submissions_on_classroom_exam_id"
    t.index ["session_token"], name: "index_exam_submissions_on_session_token", unique: true
    t.index ["student_id", "classroom_exam_id"], name: "index_exam_submissions_on_student_id_and_classroom_exam_id", unique: true
    t.index ["student_id"], name: "index_exam_submissions_on_student_id"
  end

  create_table "exams", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "created_by_type", null: false
    t.text "description"
    t.integer "duration_minutes"
    t.integer "exam_type", default: 0, null: false
    t.integer "max_score", default: 100
    t.string "title", null: false
    t.bigint "topic_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_type", "created_by_id"], name: "index_exams_on_created_by"
    t.index ["topic_id", "exam_type"], name: "index_exams_on_topic_id_and_exam_type"
    t.index ["topic_id"], name: "index_exams_on_topic_id"
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

  create_table "grade_curriculum_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "grade_curriculum_id", null: false
    t.integer "position", default: 0, null: false
    t.bigint "subject_id"
    t.bigint "topic_id"
    t.datetime "updated_at", null: false
    t.index ["grade_curriculum_id", "subject_id", "topic_id"], name: "idx_grade_curriculum_items_unique", unique: true
    t.index ["grade_curriculum_id"], name: "index_grade_curriculum_items_on_grade_curriculum_id"
    t.index ["subject_id"], name: "index_grade_curriculum_items_on_subject_id"
    t.index ["topic_id"], name: "index_grade_curriculum_items_on_topic_id"
  end

  create_table "grade_curriculums", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.datetime "created_at", null: false
    t.integer "grade", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id", "grade"], name: "index_grade_curriculums_on_academic_year_id_and_grade", unique: true
    t.index ["academic_year_id"], name: "index_grade_curriculums_on_academic_year_id"
  end

  create_table "group_conversations", force: :cascade do |t|
    t.bigint "classroom_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["classroom_id"], name: "index_group_conversations_on_classroom_id", unique: true
  end

  create_table "group_messages", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.bigint "group_conversation_id", null: false
    t.bigint "sender_id", null: false
    t.string "sender_type", null: false
    t.datetime "updated_at", null: false
    t.index ["group_conversation_id", "created_at"], name: "index_group_messages_on_group_conversation_id_and_created_at"
    t.index ["group_conversation_id"], name: "index_group_messages_on_group_conversation_id"
    t.index ["sender_type", "sender_id"], name: "index_group_messages_on_sender"
  end

  create_table "health_checkups", force: :cascade do |t|
    t.decimal "bmi", precision: 4, scale: 1
    t.datetime "created_at", null: false
    t.decimal "head_circumference_cm", precision: 4, scale: 1
    t.decimal "height_cm", precision: 5, scale: 1
    t.date "measured_at", null: false
    t.text "notes"
    t.bigint "student_id", null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.decimal "weight_kg", precision: 5, scale: 2
    t.index ["student_id", "measured_at"], name: "index_health_checkups_on_student_id_and_measured_at", unique: true
    t.index ["student_id"], name: "index_health_checkups_on_student_id"
    t.index ["teacher_id"], name: "index_health_checkups_on_teacher_id"
  end

  create_table "invitations", force: :cascade do |t|
    t.datetime "accepted_at"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.bigint "inviter_id", null: false
    t.string "inviter_type", null: false
    t.string "role", default: "teacher", null: false
    t.bigint "school_id", null: false
    t.string "status", default: "pending", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["email", "school_id"], name: "index_invitations_on_email_and_school_id", unique: true, where: "((status)::text = 'pending'::text)"
    t.index ["inviter_type", "inviter_id"], name: "index_invitations_on_inviter_type_and_inviter_id"
    t.index ["school_id"], name: "index_invitations_on_school_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "learning_objectives", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "daily_score_threshold", default: 75, null: false
    t.text "description"
    t.integer "exam_pass_threshold", default: 70, null: false
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.bigint "topic_id", null: false
    t.datetime "updated_at", null: false
    t.index ["topic_id", "name"], name: "index_learning_objectives_on_topic_id_and_name", unique: true
    t.index ["topic_id"], name: "index_learning_objectives_on_topic_id"
  end

  create_table "leave_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.bigint "parent_id", null: false
    t.text "reason", null: false
    t.text "rejection_reason"
    t.integer "request_type", default: 0, null: false
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.date "start_date", null: false
    t.integer "status", default: 0, null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id", "status"], name: "index_leave_requests_on_parent_id_and_status"
    t.index ["parent_id"], name: "index_leave_requests_on_parent_id"
    t.index ["reviewed_by_id"], name: "index_leave_requests_on_reviewed_by_id"
    t.index ["student_id", "status"], name: "index_leave_requests_on_student_id_and_status"
    t.index ["student_id"], name: "index_leave_requests_on_student_id"
  end

  create_table "messages", force: :cascade do |t|
    t.text "body", null: false
    t.bigint "conversation_id", null: false
    t.datetime "created_at", null: false
    t.datetime "read_at"
    t.bigint "sender_id", null: false
    t.string "sender_type", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "created_at"], name: "index_messages_on_conversation_id_and_created_at"
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["sender_type", "sender_id"], name: "index_messages_on_sender"
  end

  create_table "notifications", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.string "kind"
    t.bigint "notifiable_id", null: false
    t.string "notifiable_type", null: false
    t.jsonb "params", default: {}
    t.datetime "read_at"
    t.bigint "recipient_id", null: false
    t.string "recipient_type", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["kind"], name: "index_notifications_on_kind"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["recipient_type", "recipient_id", "read_at"], name: "idx_on_recipient_type_recipient_id_read_at_50191a301d"
    t.index ["recipient_type", "recipient_id"], name: "index_notifications_on_recipient"
  end

  create_table "objective_masteries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "daily_mastered", default: false, null: false
    t.boolean "exam_mastered", default: false, null: false
    t.bigint "learning_objective_id", null: false
    t.datetime "mastered_at"
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.index ["learning_objective_id"], name: "index_objective_masteries_on_learning_objective_id"
    t.index ["student_id", "learning_objective_id"], name: "idx_objective_masteries_unique", unique: true
    t.index ["student_id"], name: "index_objective_masteries_on_student_id"
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

  create_table "push_devices", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "last_seen_at"
    t.string "platform", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "user_type", null: false
    t.index ["token"], name: "index_push_devices_on_token", unique: true
    t.index ["user_type", "user_id"], name: "index_push_devices_on_user_type_and_user_id"
  end

  create_table "question_templates", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.string "formula", null: false
    t.integer "grade_max", default: 12, null: false
    t.integer "grade_min", default: 1, null: false
    t.string "name", null: false
    t.string "template_text", null: false
    t.datetime "updated_at", null: false
    t.jsonb "variables", default: [], null: false
    t.index ["category"], name: "index_question_templates_on_category"
    t.index ["grade_min", "grade_max"], name: "index_question_templates_on_grade_min_and_grade_max"
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

  create_table "rubric_criteria", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "exam_id", null: false
    t.integer "max_score", default: 5, null: false
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["exam_id", "position"], name: "index_rubric_criteria_on_exam_id_and_position"
    t.index ["exam_id"], name: "index_rubric_criteria_on_exam_id"
  end

  create_table "rubric_scores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exam_submission_id", null: false
    t.text "feedback"
    t.bigint "rubric_criteria_id", null: false
    t.integer "score", null: false
    t.datetime "updated_at", null: false
    t.index ["exam_submission_id", "rubric_criteria_id"], name: "idx_rubric_scores_unique", unique: true
    t.index ["exam_submission_id"], name: "index_rubric_scores_on_exam_submission_id"
    t.index ["rubric_criteria_id"], name: "index_rubric_scores_on_rubric_criteria_id"
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
    t.integer "max_annual_leave_days", default: 12, null: false
    t.integer "max_grade", default: 6, null: false
    t.integer "max_sick_leave_days", default: 14, null: false
    t.integer "min_grade", default: 1, null: false
    t.string "name", null: false
    t.datetime "onboarding_completed_at"
    t.integer "onboarding_step", default: 0, null: false
    t.string "phone"
    t.string "postal_code"
    t.string "state_province"
    t.datetime "updated_at", null: false
    t.string "website"
  end

  create_table "solid_cable_messages", force: :cascade do |t|
    t.binary "channel", null: false
    t.bigint "channel_hash", null: false
    t.datetime "created_at", null: false
    t.binary "payload", null: false
    t.index ["channel"], name: "index_solid_cable_messages_on_channel"
    t.index ["channel_hash"], name: "index_solid_cable_messages_on_channel_hash"
    t.index ["created_at"], name: "index_solid_cable_messages_on_created_at"
  end

  create_table "solid_cache_entries", force: :cascade do |t|
    t.integer "byte_size", null: false
    t.datetime "created_at", null: false
    t.binary "key", null: false
    t.bigint "key_hash", null: false
    t.binary "value", null: false
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["key_hash", "byte_size"], name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash", unique: true
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "student_questions", force: :cascade do |t|
    t.bigint "classroom_exam_id", null: false
    t.string "correct_answer", null: false
    t.datetime "created_at", null: false
    t.bigint "exam_question_id", null: false
    t.string "generated_text", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.jsonb "values", default: {}, null: false
    t.index ["classroom_exam_id"], name: "index_student_questions_on_classroom_exam_id"
    t.index ["exam_question_id", "student_id", "classroom_exam_id"], name: "idx_student_questions_unique", unique: true
    t.index ["exam_question_id"], name: "index_student_questions_on_exam_question_id"
    t.index ["student_id"], name: "index_student_questions_on_student_id"
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

  create_table "subjects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.bigint "school_id", null: false
    t.datetime "updated_at", null: false
    t.index ["school_id", "name"], name: "index_subjects_on_school_id_and_name", unique: true
    t.index ["school_id"], name: "index_subjects_on_school_id"
  end

  create_table "teacher_leave_balances", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.datetime "created_at", null: false
    t.integer "max_annual_leave", default: 12, null: false
    t.integer "max_sick_leave", default: 14, null: false
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.decimal "used_annual", precision: 5, scale: 1, default: "0.0", null: false
    t.decimal "used_personal", precision: 5, scale: 1, default: "0.0", null: false
    t.decimal "used_sick", precision: 5, scale: 1, default: "0.0", null: false
    t.index ["academic_year_id"], name: "index_teacher_leave_balances_on_academic_year_id"
    t.index ["teacher_id", "academic_year_id"], name: "idx_on_teacher_id_academic_year_id_92d490e14f", unique: true
    t.index ["teacher_id"], name: "index_teacher_leave_balances_on_teacher_id"
  end

  create_table "teacher_leave_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.integer "half_day_session"
    t.text "reason", null: false
    t.text "rejection_reason"
    t.integer "request_type", default: 0, null: false
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.bigint "school_id", null: false
    t.date "start_date", null: false
    t.integer "status", default: 0, null: false
    t.bigint "substitute_id"
    t.bigint "teacher_id", null: false
    t.datetime "updated_at", null: false
    t.index ["reviewed_by_id"], name: "index_teacher_leave_requests_on_reviewed_by_id"
    t.index ["school_id", "status"], name: "index_teacher_leave_requests_on_school_id_and_status"
    t.index ["school_id"], name: "index_teacher_leave_requests_on_school_id"
    t.index ["substitute_id"], name: "index_teacher_leave_requests_on_substitute_id"
    t.index ["teacher_id", "status"], name: "index_teacher_leave_requests_on_teacher_id_and_status"
    t.index ["teacher_id"], name: "index_teacher_leave_requests_on_teacher_id"
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

  create_table "topics", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.bigint "subject_id", null: false
    t.datetime "updated_at", null: false
    t.index ["subject_id", "name"], name: "index_topics_on_subject_id_and_name", unique: true
    t.index ["subject_id"], name: "index_topics_on_subject_id"
  end

  add_foreign_key "academic_years", "schools"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attendances", "classrooms"
  add_foreign_key "attendances", "leave_requests"
  add_foreign_key "attendances", "students"
  add_foreign_key "classroom_events", "classrooms"
  add_foreign_key "classroom_exams", "classrooms"
  add_foreign_key "classroom_exams", "exams"
  add_foreign_key "classroom_students", "classrooms"
  add_foreign_key "classroom_students", "students"
  add_foreign_key "classroom_teachers", "classrooms"
  add_foreign_key "classroom_teachers", "teachers"
  add_foreign_key "classrooms", "schools"
  add_foreign_key "consents", "parents"
  add_foreign_key "consents", "students"
  add_foreign_key "conversations", "parents"
  add_foreign_key "conversations", "students"
  add_foreign_key "conversations", "teachers"
  add_foreign_key "daily_scores", "students"
  add_foreign_key "daily_scores", "teachers"
  add_foreign_key "exam_answers", "exam_questions"
  add_foreign_key "exam_answers", "exam_submissions"
  add_foreign_key "exam_answers", "student_questions"
  add_foreign_key "exam_questions", "exams"
  add_foreign_key "exam_submissions", "classroom_exams"
  add_foreign_key "exam_submissions", "students"
  add_foreign_key "exams", "topics"
  add_foreign_key "feed_post_comments", "feed_posts"
  add_foreign_key "feed_post_likes", "feed_posts"
  add_foreign_key "feed_post_students", "feed_posts"
  add_foreign_key "feed_post_students", "students"
  add_foreign_key "feed_posts", "classrooms"
  add_foreign_key "feed_posts", "teachers"
  add_foreign_key "grade_curriculum_items", "grade_curriculums"
  add_foreign_key "grade_curriculum_items", "subjects"
  add_foreign_key "grade_curriculum_items", "topics"
  add_foreign_key "grade_curriculums", "academic_years"
  add_foreign_key "group_conversations", "classrooms"
  add_foreign_key "group_messages", "group_conversations"
  add_foreign_key "health_checkups", "students"
  add_foreign_key "health_checkups", "teachers"
  add_foreign_key "invitations", "schools"
  add_foreign_key "learning_objectives", "topics"
  add_foreign_key "leave_requests", "parents"
  add_foreign_key "leave_requests", "students"
  add_foreign_key "leave_requests", "teachers", column: "reviewed_by_id"
  add_foreign_key "messages", "conversations"
  add_foreign_key "objective_masteries", "learning_objectives"
  add_foreign_key "objective_masteries", "students"
  add_foreign_key "parent_students", "parents"
  add_foreign_key "parent_students", "students"
  add_foreign_key "rubric_criteria", "exams"
  add_foreign_key "rubric_scores", "exam_submissions"
  add_foreign_key "rubric_scores", "rubric_criteria", column: "rubric_criteria_id"
  add_foreign_key "school_managers", "schools"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "student_questions", "classroom_exams"
  add_foreign_key "student_questions", "exam_questions"
  add_foreign_key "student_questions", "students"
  add_foreign_key "subjects", "schools"
  add_foreign_key "teacher_leave_balances", "academic_years"
  add_foreign_key "teacher_leave_balances", "teachers"
  add_foreign_key "teacher_leave_requests", "school_managers", column: "reviewed_by_id"
  add_foreign_key "teacher_leave_requests", "schools"
  add_foreign_key "teacher_leave_requests", "teachers"
  add_foreign_key "teacher_leave_requests", "teachers", column: "substitute_id"
  add_foreign_key "teachers", "schools"
  add_foreign_key "topics", "subjects"

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
