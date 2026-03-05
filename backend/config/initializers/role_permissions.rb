module RolePermissions
  DEFAULTS = {
    "teacher" => {
      "classrooms" => %w[index show overview],
      "students" => %w[show radar progress],
      "daily_scores" => %w[index create update]
    },
    "parent" => {
      "students" => %w[show radar progress],
      "daily_scores" => %w[index],
      "children" => %w[index]
    },
    "school_manager" => {
      "classrooms" => %w[index show overview],
      "students" => %w[index show radar progress],
      "daily_scores" => %w[index],
      "feed_posts" => %w[index show create],
      "calendar_events" => %w[index create destroy],
      "teachers" => %w[index show manage],
      "school" => %w[show manage]
    },
    "admin" => :all
  }.freeze
end
