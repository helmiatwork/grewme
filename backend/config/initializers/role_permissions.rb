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
    "admin" => :all
  }.freeze
end
