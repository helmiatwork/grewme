# frozen_string_literal: true

require "ostruct"

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [ Types::NodeType, null: true ], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ ID ], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # === Auth ===

    field :me, Types::UserUnion, null: false, description: "Current authenticated user"

    def me
      authenticate!
      current_user
    end

    # === Classrooms ===

    field :classrooms, [ Types::ClassroomType ], null: false, description: "List classrooms for current teacher"

    def classrooms
      authenticate!
      ClassroomPolicy::Scope.new(current_user, Classroom).resolve
        .includes(:classroom_teachers, :classroom_students)
    end

    field :classroom, Types::ClassroomType, null: false, description: "Get a single classroom" do
      argument :id, ID, required: true
    end

    def classroom(id:)
      authenticate!
      classroom = Classroom.find(id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?
      classroom
    end

    field :classroom_overview, Types::ClassroomOverviewType, null: false, description: "Classroom radar overview" do
      argument :classroom_id, ID, required: true
    end

    def classroom_overview(classroom_id:)
      authenticate!
      classroom = Classroom.find(classroom_id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).overview?

      students = classroom.students.includes(:daily_scores)
      student_radars = students.map do |student|
        averages = student.radar_data
        OpenStruct.new(
          student_id: student.id,
          student_name: student.name,
          skills: OpenStruct.new(
            reading: averages["reading"]&.round(1),
            math: averages["math"]&.round(1),
            writing: averages["writing"]&.round(1),
            logic: averages["logic"]&.round(1),
            social: averages["social"]&.round(1)
          )
        )
      end

      OpenStruct.new(
        classroom_id: classroom.id,
        classroom_name: classroom.name,
        students: student_radars
      )
    end

    # === Students ===

    field :student, Types::StudentType, null: false, description: "Get a single student" do
      argument :id, ID, required: true
    end

    def student(id:)
      authenticate!
      student = Student.find(id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?
      student
    end

    field :student_radar, Types::RadarDataType, null: false, description: "Student radar chart data" do
      argument :student_id, ID, required: true
    end

    def student_radar(student_id:)
      authenticate!
      student = Student.find(student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).radar?

      averages = student.radar_data
      OpenStruct.new(
        student_id: student.id,
        student_name: student.name,
        skills: OpenStruct.new(
          reading: averages["reading"]&.round(1),
          math: averages["math"]&.round(1),
          writing: averages["writing"]&.round(1),
          logic: averages["logic"]&.round(1),
          social: averages["social"]&.round(1)
        )
      )
    end

    field :student_progress, Types::ProgressDataType, null: false, description: "Student weekly progress" do
      argument :student_id, ID, required: true
    end

    def student_progress(student_id:)
      authenticate!
      student = Student.find(student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).progress?

      weeks = 4.downto(0).map do |i|
        week_start = i.weeks.ago.beginning_of_week.to_date
        week_end = i.weeks.ago.end_of_week.to_date
        averages = student.radar_data(start_date: week_start, end_date: week_end)
        OpenStruct.new(
          period: "Week of #{week_start.strftime("%b %d")}",
          skills: OpenStruct.new(
            reading: averages["reading"]&.round(1),
            math: averages["math"]&.round(1),
            writing: averages["writing"]&.round(1),
            logic: averages["logic"]&.round(1),
            social: averages["social"]&.round(1)
          )
        )
      end

      OpenStruct.new(weeks: weeks)
    end

    field :student_daily_scores, Types::DailyScoreType.connection_type, null: false, description: "Student daily scores (paginated)" do
      argument :student_id, ID, required: true
      argument :skill_category, Types::SkillCategoryEnum, required: false
    end

    def student_daily_scores(student_id:, skill_category: nil)
      authenticate!
      student = Student.find(student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?

      scope = student.daily_scores.order(date: :desc)
      scope = scope.where(skill_category: skill_category) if skill_category
      scope
    end

    # === Parent ===

    field :my_children, [ Types::StudentType ], null: false, description: "List children for current parent"

    def my_children
      authenticate!
      raise GraphQL::ExecutionError, "Only parents can access this" unless current_user.parent?
      current_user.children
    end

    # === Admin ===

    field :user_permissions, Types::UserPermissionsType, null: false, description: "Get user permissions (admin only)" do
      argument :user_id, ID, required: true
      argument :user_type, String, required: true, description: "Teacher or Parent"
    end

    def user_permissions(user_id:, user_type:)
      authenticate!
      raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, Permission).index?

      klass = user_type.safe_constantize
      raise GraphQL::ExecutionError, "Invalid user type" unless klass && [ Teacher, Parent ].include?(klass)
      target_user = klass.find(user_id)

      OpenStruct.new(
        user_id: target_user.id,
        role: target_user.role,
        overrides: target_user.permissions,
        effective: target_user.effective_permissions
      )
    end
  end
end
