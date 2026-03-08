module RolePermissions
  DEFAULTS = {
    "teacher" => {
      "classrooms" => %w[index show overview],
      "students" => %w[show radar progress],
      "daily_scores" => %w[index create update],
      "subjects" => %w[index show create update destroy],
      "topics" => %w[index show create update destroy],
      "learning_objectives" => %w[index show create update destroy],
      "exams" => %w[index show create update destroy],
      "classroom_exams" => %w[index show create update],
      "exam_submissions" => %w[index show create update],
      "academic_years" => %w[index show create update],
      "grade_curriculums" => %w[index show create update],
      "attendances" => %w[index create update],
      "leave_requests" => %w[index show review]
    },
    "parent" => {
      "students" => %w[show radar progress],
      "daily_scores" => %w[index],
      "children" => %w[index],
      "subjects" => %w[index show],
      "exams" => %w[index show],
      "exam_submissions" => %w[index show],
      "academic_years" => %w[index show],
      "grade_curriculums" => %w[index show],
      "leave_requests" => %w[index create delete]
    },
    "school_manager" => {
      "classrooms" => %w[index show overview],
      "students" => %w[index show radar progress],
      "daily_scores" => %w[index],
      "feed_posts" => %w[index show create],
      "calendar_events" => %w[index create destroy],
      "teachers" => %w[index show manage],
      "school" => %w[show manage],
      "subjects" => %w[index show create update destroy],
      "topics" => %w[index show create update destroy],
      "learning_objectives" => %w[index show create update destroy],
      "exams" => %w[index show create update destroy],
      "classroom_exams" => %w[index show create update destroy],
      "exam_submissions" => %w[index show],
      "academic_years" => %w[index show create update],
      "grade_curriculums" => %w[index show create update],
      "attendances" => %w[index show],
      "leave_requests" => %w[index show]
    },
    "admin" => :all
  }.freeze
end
