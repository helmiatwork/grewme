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

    field :classroom_daily_scores, [ Types::DailyScoreType ], null: false, description: "Daily scores for a classroom on a given date and skill" do
      argument :classroom_id, ID, required: true
      argument :date, GraphQL::Types::ISO8601Date, required: true
      argument :skill_category, Types::SkillCategoryEnum, required: true
    end

    def classroom_daily_scores(classroom_id:, date:, skill_category:)
      authenticate!
      classroom = Classroom.find(classroom_id)
      raise Pundit::NotAuthorizedError unless ClassroomPolicy.new(current_user, classroom).show?

      student_ids = classroom.students.pluck(:id)
      DailyScore.where(student_id: student_ids, date: date, skill_category: skill_category)
        .includes(:student, :teacher)
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

    # === Feed ===

    field :feed_posts, Types::FeedPostType.connection_type, null: false, description: "Feed posts for parent's classrooms" do
      argument :classroom_ids, [ ID ], required: false
      argument :student_ids, [ ID ], required: false
    end

    def feed_posts(classroom_ids: nil, student_ids: nil)
      authenticate!

      if current_user.school_manager?
        school_classroom_ids = current_user.school_classroom_ids
        ids = classroom_ids ? (classroom_ids.map(&:to_i) & school_classroom_ids) : school_classroom_ids
      elsif current_user.parent?
        child_classroom_ids = current_user.children
          .joins(:classroom_students)
          .where(classroom_students: { status: :active })
          .pluck("classroom_students.classroom_id")
          .uniq

        ids = classroom_ids ? (classroom_ids.map(&:to_i) & child_classroom_ids) : child_classroom_ids
      elsif current_user.teacher?
        ids = classroom_ids || current_user.classroom_ids
      else
        ids = []
      end

      scope = FeedPost.where(classroom_id: ids).order(created_at: :desc).includes(:teacher, :classroom, :tagged_students)

      if student_ids.present?
        scope = scope.joins(:feed_post_students).where(feed_post_students: { student_id: student_ids }).distinct
      end

      scope
    end

    field :feed_post, Types::FeedPostType, null: false, description: "Single feed post" do
      argument :id, ID, required: true
    end

    def feed_post(id:)
      post = FeedPost.find(id)
      if context[:current_user]
        raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).show?
      end
      post
    end

    # === Chat ===

    field :conversations, [ Types::ConversationType ], null: false, description: "List conversations for current user"

    def conversations
      authenticate!
      raise GraphQL::ExecutionError, "Only teachers and parents can access chat" unless current_user.teacher? || current_user.parent?

      Conversation.for_user(current_user)
        .includes(:student, :parent, :teacher, messages: :sender)
        .order(updated_at: :desc)
    end

    field :conversation, Types::ConversationType, null: false, description: "Get a single conversation" do
      argument :id, ID, required: true
    end

    def conversation(id:)
      authenticate!
      conv = Conversation.find(id)
      raise Pundit::NotAuthorizedError unless ConversationPolicy.new(current_user, conv).show?
      conv
    end

    # === Calendar ===

    field :classroom_events, [ Types::ClassroomEventType ], null: false, description: "Events for classrooms in a given month" do
      argument :classroom_ids, [ ID ], required: false
      argument :month, GraphQL::Types::ISO8601Date, required: true, description: "Any date in the target month"
    end

    def classroom_events(month:, classroom_ids: nil)
      authenticate!

      if current_user.teacher?
        ids = classroom_ids || current_user.classroom_ids
      elsif current_user.parent?
        child_classroom_ids = current_user.children
          .joins(:classroom_students)
          .where(classroom_students: { status: :active })
          .pluck("classroom_students.classroom_id")
          .uniq
        ids = classroom_ids ? (classroom_ids.map(&:to_i) & child_classroom_ids) : child_classroom_ids
      elsif current_user.school_manager?
        school_classroom_ids = current_user.school_classroom_ids
        ids = classroom_ids ? (classroom_ids.map(&:to_i) & school_classroom_ids) : school_classroom_ids
      else
        ids = []
      end

      ClassroomEvent.for_classroom_ids(ids).for_month(Date.parse(month.to_s))
        .order(event_date: :asc, start_time: :asc)
        .includes(:classroom, :creator)
    end

    # === Notifications ===

    field :notifications, Types::NotificationType.connection_type, null: false, description: "Current user's notifications"

    def notifications
      authenticate!
      unless current_user.parent? || current_user.teacher?
        raise GraphQL::ExecutionError, "Not available for this role"
      end

      current_user.notifications.recent.includes(:notifiable)
    end

    field :unread_notification_count, Integer, null: false, description: "Count of unread notifications"

    def unread_notification_count
      authenticate!
      return 0 unless current_user.parent? || current_user.teacher?

      current_user.notifications.unread.count
    end

    # === School ===

    field :school_overview, Types::SchoolOverviewType, null: false, description: "School overview stats (school_manager only)"

    def school_overview
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can access this" unless current_user.school_manager?

      school = current_user.school
      OpenStruct.new(
        school_name: school.name,
        classroom_count: school.classrooms.count,
        student_count: Student.joins(classroom_students: :classroom)
          .merge(ClassroomStudent.current)
          .where(classrooms: { school_id: school.id })
          .distinct.count,
        teacher_count: school.teachers.count
      )
    end

    field :school_teachers, [ Types::TeacherType ], null: false, description: "All teachers in the school (school_manager only)"

    def school_teachers
      authenticate!
      raise GraphQL::ExecutionError, "Only school managers can access this" unless current_user.school_manager?

      current_user.school.teachers.includes(:classrooms)
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

      overrides = target_user.permissions
      override_keys = overrides.map { |p| [ p.resource, p.action ] }.to_set

      effective = target_user.effective_permissions.flat_map do |resource, actions|
        actions.map do |action, granted|
          source = override_keys.include?([ resource, action ]) ? "override" : "role_default"
          OpenStruct.new(resource: resource, action: action, granted: granted, source: source)
        end
      end

      OpenStruct.new(
        user_id: target_user.id,
        role: target_user.role,
        overrides: overrides,
        effective: effective
      )
    end
  end
end
