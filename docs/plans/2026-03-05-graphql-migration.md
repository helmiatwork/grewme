# GraphQL Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the entire REST API layer with GraphQL using graphql-ruby 2.5, keeping all models, policies, and auth concerns intact.

**Architecture:** Single `POST /graphql` endpoint. GraphqlController uses existing `Authenticatable` concern to pipe `current_user` into GraphQL context. Pundit policies called manually in resolvers/mutations. GraphQL::Dataloader for N+1 prevention. "Errors as data" pattern for mutations.

**Tech Stack:** graphql ~> 2.5, Rails 8.1.2, Devise-JWT, Pundit, Minitest

---

### Task 1: Add graphql gem and generate scaffold

**Files:**
- Modify: `Gemfile`
- Create: `app/graphql/grewme_schema.rb`
- Create: `app/graphql/types/base_object.rb`
- Create: `app/graphql/types/base_field.rb`
- Create: `app/graphql/types/base_argument.rb`
- Create: `app/graphql/types/base_enum.rb`
- Create: `app/graphql/types/base_input_object.rb`
- Create: `app/graphql/types/base_union.rb`
- Create: `app/graphql/types/base_interface.rb`
- Create: `app/graphql/types/base_scalar.rb`
- Create: `app/graphql/types/base_connection.rb`
- Create: `app/graphql/types/base_edge.rb`
- Create: `app/graphql/mutations/base_mutation.rb`
- Create: `app/graphql/types/query_type.rb`
- Create: `app/graphql/types/mutation_type.rb`
- Create: `app/graphql/types/node_type.rb`
- Create: `app/controllers/graphql_controller.rb`
- Modify: `config/routes.rb`

**Step 1: Add graphql gem to Gemfile**

Add after the `alba` line in the `# API & serialization` section:

```ruby
gem "graphql", "~> 2.5"
```

**Step 2: Run bundle install**

Run: `bundle install`
Expected: graphql gem installed successfully

**Step 3: Run the graphql generator**

Run: `bin/rails generate graphql:install`
Expected: Creates `app/graphql/` directory with schema, types, mutations, and `graphql_controller.rb`

**Step 4: Update GraphqlController to use existing auth**

Replace the generated `app/controllers/graphql_controller.rb` with:

```ruby
class GraphqlController < ApplicationController
  # Skip auth for the execute action — we handle it per-query/mutation
  skip_before_action :authenticate_user!

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]

    # Try to authenticate (don't fail if no token — some mutations are public)
    token = extract_token
    user = nil
    if token.present?
      payload = decode_jwt(token)
      user = find_authenticatable(payload) if payload
    end

    context = {
      current_user: user,
      request: request
    }

    result = GrewmeSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  rescue StandardError => e
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private

  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")

    render json: { errors: [{ message: e.message, backtrace: e.backtrace.first(5) }], data: {} }, status: :internal_server_error
  end
end
```

**Step 5: Update GrewmeSchema with dataloader and error handling**

Replace `app/graphql/grewme_schema.rb` with:

```ruby
class GrewmeSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)

  use GraphQL::Dataloader

  # Union and interface resolution
  def self.resolve_type(abstract_type, obj, ctx)
    case obj
    when Teacher then Types::TeacherType
    when Parent then Types::ParentType
    else
      raise GraphQL::ExecutionError, "Unexpected object: #{obj}"
    end
  end

  def self.id_from_object(object, type_definition, query_ctx)
    object.to_gid_param
  end

  def self.object_from_id(global_id, query_ctx)
    GlobalID.find(global_id)
  end

  # Error handling
  rescue_from(ActiveRecord::RecordNotFound) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "#{err.model || 'Record'} not found"
  end

  rescue_from(Pundit::NotAuthorizedError) do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "Not authorized"
  end

  # Limits
  default_max_page_size 100
  default_page_size 30
end
```

**Step 6: Update base types with auth helpers**

Replace `app/graphql/types/base_object.rb` with:

```ruby
module Types
  class BaseObject < GraphQL::Schema::Object
    edge_type_class(Types::BaseEdge)
    connection_type_class(Types::BaseConnection)
    field_class Types::BaseField

    def current_user
      context[:current_user]
    end

    def authenticate!
      raise GraphQL::ExecutionError, "Authentication required" unless current_user
    end
  end
end
```

Replace `app/graphql/mutations/base_mutation.rb` with:

```ruby
module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    argument_class Types::BaseArgument
    field_class Types::BaseField

    def current_user
      context[:current_user]
    end

    def authenticate!
      raise GraphQL::ExecutionError, "Authentication required" unless current_user
    end

    def authorize!(record, action)
      policy_class = "#{record.class}Policy".constantize
      policy = policy_class.new(current_user, record)
      raise Pundit::NotAuthorizedError unless policy.public_send(action)
    end
  end
end
```

**Step 7: Add route**

In `config/routes.rb`, add inside the top level (before the `namespace :api` block):

```ruby
post "/graphql", to: "graphql#execute"
```

**Step 8: Run existing tests to verify nothing broke**

Run: `bin/rails test`
Expected: All 107 tests still pass (we haven't removed anything yet)

**Step 9: Commit**

```bash
git add -A && git commit -m "feat(graphql): add graphql-ruby gem, schema, base types, and controller"
```

---

### Task 2: Create GraphQL types for all models

**Files:**
- Create: `app/graphql/types/teacher_type.rb`
- Create: `app/graphql/types/parent_type.rb`
- Create: `app/graphql/types/user_union.rb`
- Create: `app/graphql/types/classroom_type.rb`
- Create: `app/graphql/types/student_type.rb`
- Create: `app/graphql/types/daily_score_type.rb`
- Create: `app/graphql/types/skill_category_enum.rb`
- Create: `app/graphql/types/radar_skill_type.rb`
- Create: `app/graphql/types/radar_data_type.rb`
- Create: `app/graphql/types/progress_week_type.rb`
- Create: `app/graphql/types/progress_data_type.rb`
- Create: `app/graphql/types/permission_type.rb`
- Create: `app/graphql/types/classroom_overview_type.rb`
- Create: `app/graphql/types/user_error_type.rb`

**Step 1: Create SkillCategoryEnum**

```ruby
# app/graphql/types/skill_category_enum.rb
module Types
  class SkillCategoryEnum < Types::BaseEnum
    value "READING", value: "reading"
    value "MATH", value: "math"
    value "WRITING", value: "writing"
    value "LOGIC", value: "logic"
    value "SOCIAL", value: "social"
  end
end
```

**Step 2: Create UserErrorType**

```ruby
# app/graphql/types/user_error_type.rb
module Types
  class UserErrorType < Types::BaseObject
    field :message, String, null: false
    field :path, [String]
  end
end
```

**Step 3: Create TeacherType**

```ruby
# app/graphql/types/teacher_type.rb
module Types
  class TeacherType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :classrooms, [Types::ClassroomType], null: false

    def classrooms
      dataloader.with(GraphQL::Dataloader::ActiveRecordAssociationSource, object, :classrooms).load(nil)
    end
  end
end
```

**Step 4: Create ParentType**

```ruby
# app/graphql/types/parent_type.rb
module Types
  class ParentType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, null: false
    field :role, String, null: false
    field :children, [Types::StudentType], null: false

    def children
      dataloader.with(GraphQL::Dataloader::ActiveRecordAssociationSource, object, :children).load(nil)
    end
  end
end
```

**Step 5: Create UserUnion**

```ruby
# app/graphql/types/user_union.rb
module Types
  class UserUnion < Types::BaseUnion
    possible_types Types::TeacherType, Types::ParentType

    def self.resolve_type(object, context)
      case object
      when Teacher then Types::TeacherType
      when Parent then Types::ParentType
      else
        raise GraphQL::ExecutionError, "Unknown user type: #{object.class}"
      end
    end
  end
end
```

**Step 6: Create ClassroomType**

```ruby
# app/graphql/types/classroom_type.rb
module Types
  class ClassroomType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :student_count, Integer, null: false
    field :students, [Types::StudentType], null: false

    def student_count
      object.classroom_students.select(&:active?).size
    end

    def students
      dataloader.with(GraphQL::Dataloader::ActiveRecordAssociationSource, object, :students).load(nil)
    end
  end
end
```

**Step 7: Create StudentType**

```ruby
# app/graphql/types/student_type.rb
module Types
  class StudentType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :avatar, String
    field :daily_scores, Types::DailyScoreType.connection_type, null: false

    def daily_scores
      object.daily_scores.order(date: :desc)
    end
  end
end
```

**Step 8: Create DailyScoreType**

```ruby
# app/graphql/types/daily_score_type.rb
module Types
  class DailyScoreType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :skill_category, Types::SkillCategoryEnum, null: false
    field :score, Integer, null: false
    field :notes, String
    field :student_id, ID, null: false
  end
end
```

**Step 9: Create RadarSkillType and RadarDataType**

```ruby
# app/graphql/types/radar_skill_type.rb
module Types
  class RadarSkillType < Types::BaseObject
    field :reading, Float
    field :math, Float
    field :writing, Float
    field :logic, Float
    field :social, Float
  end
end
```

```ruby
# app/graphql/types/radar_data_type.rb
module Types
  class RadarDataType < Types::BaseObject
    field :student_id, ID, null: false
    field :student_name, String, null: false
    field :skills, Types::RadarSkillType, null: false
  end
end
```

**Step 10: Create ProgressWeekType and ProgressDataType**

```ruby
# app/graphql/types/progress_week_type.rb
module Types
  class ProgressWeekType < Types::BaseObject
    field :period, String, null: false
    field :skills, Types::RadarSkillType, null: false
  end
end
```

```ruby
# app/graphql/types/progress_data_type.rb
module Types
  class ProgressDataType < Types::BaseObject
    field :weeks, [Types::ProgressWeekType], null: false
  end
end
```

**Step 11: Create ClassroomOverviewType**

```ruby
# app/graphql/types/classroom_overview_type.rb
module Types
  class ClassroomOverviewType < Types::BaseObject
    field :classroom_id, ID, null: false
    field :classroom_name, String, null: false
    field :students, [Types::RadarDataType], null: false
  end
end
```

**Step 12: Create PermissionType**

```ruby
# app/graphql/types/permission_type.rb
module Types
  class PermissionType < Types::BaseObject
    field :id, ID, null: false
    field :resource, String, null: false
    field :action, String, null: false
    field :granted, Boolean, null: false
  end
end
```

**Step 13: Run tests**

Run: `bin/rails test`
Expected: All 107 tests still pass

**Step 14: Commit**

```bash
git add -A && git commit -m "feat(graphql): add all GraphQL types for models"
```

---

### Task 3: Create auth mutations (login, register, refresh, logout)

**Files:**
- Create: `app/graphql/types/auth_payload_type.rb`
- Create: `app/graphql/types/register_input_type.rb`
- Create: `app/graphql/mutations/login.rb`
- Create: `app/graphql/mutations/register.rb`
- Create: `app/graphql/mutations/refresh_token.rb`
- Create: `app/graphql/mutations/logout.rb`
- Modify: `app/graphql/types/mutation_type.rb`

**Step 1: Create AuthPayloadType**

```ruby
# app/graphql/types/auth_payload_type.rb
module Types
  class AuthPayloadType < Types::BaseObject
    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :user, Types::UserUnion
    field :errors, [Types::UserErrorType], null: false
  end
end
```

**Step 2: Create RegisterInputType**

```ruby
# app/graphql/types/register_input_type.rb
module Types
  class RegisterInputType < Types::BaseInputObject
    argument :name, String, required: true
    argument :email, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :role, String, required: true, description: "teacher or parent"
    argument :phone, String, required: false, description: "Required for parents"
  end
end
```

**Step 3: Create Login mutation**

```ruby
# app/graphql/mutations/login.rb
module Mutations
  class Login < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true
    argument :role, String, required: true, description: "teacher or parent"

    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :user, Types::UserUnion
    field :errors, [Types::UserErrorType], null: false

    def resolve(email:, password:, role:)
      klass = role == "teacher" ? Teacher : Parent
      user = klass.find_by(email: email)

      unless user&.valid_password?(password)
        return { errors: [{ message: "Invalid email or password", path: ["email"] }] }
      end

      access_token = generate_jwt_for(user)
      refresh = user.refresh_tokens.create!(
        ip_address: context[:request].remote_ip,
        user_agent: context[:request].user_agent
      )

      {
        access_token: access_token,
        refresh_token: refresh.raw_token,
        expires_in: jwt_expiration_time,
        user: user,
        errors: []
      }
    end

    private

    def generate_jwt_for(entity)
      secret = Rails.application.credentials.devise_jwt_secret_key!
      payload = entity.jwt_payload.merge(
        "jti" => SecureRandom.uuid,
        "iat" => Time.current.to_i,
        "exp" => Devise::JWT.config.expiration_time.seconds.from_now.to_i
      )
      JWT.encode(payload, secret, "HS256")
    end

    def jwt_expiration_time
      Devise::JWT.config.expiration_time
    end
  end
end
```

**Step 4: Create Register mutation**

```ruby
# app/graphql/mutations/register.rb
module Mutations
  class Register < BaseMutation
    argument :input, Types::RegisterInputType, required: true

    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :user, Types::UserUnion
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      attrs = input.to_h.except(:role)
      klass = input.role == "teacher" ? Teacher : Parent
      user = klass.new(attrs)

      unless user.save
        return {
          errors: user.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
        }
      end

      access_token = generate_jwt_for(user)
      refresh = user.refresh_tokens.create!(
        ip_address: context[:request].remote_ip,
        user_agent: context[:request].user_agent
      )

      {
        access_token: access_token,
        refresh_token: refresh.raw_token,
        expires_in: jwt_expiration_time,
        user: user,
        errors: []
      }
    end

    private

    def generate_jwt_for(entity)
      secret = Rails.application.credentials.devise_jwt_secret_key!
      payload = entity.jwt_payload.merge(
        "jti" => SecureRandom.uuid,
        "iat" => Time.current.to_i,
        "exp" => Devise::JWT.config.expiration_time.seconds.from_now.to_i
      )
      JWT.encode(payload, secret, "HS256")
    end

    def jwt_expiration_time
      Devise::JWT.config.expiration_time
    end
  end
end
```

**Step 5: Create RefreshToken mutation**

```ruby
# app/graphql/mutations/refresh_token.rb
module Mutations
  class RefreshToken < BaseMutation
    argument :refresh_token, String, required: true
    argument :role, String, required: true, description: "teacher or parent"

    field :access_token, String
    field :refresh_token, String
    field :expires_in, Integer
    field :errors, [Types::UserErrorType], null: false

    def resolve(refresh_token:, role:)
      type = role == "teacher" ? "Teacher" : "Parent"
      token_digest = Digest::SHA256.hexdigest(refresh_token)
      token_record = ::RefreshToken.find_by(token_digest: token_digest, authenticatable_type: type)

      if token_record.nil? || !token_record.active?
        return { errors: [{ message: "Invalid or expired refresh token", path: ["refreshToken"] }] }
      end

      token_record.revoke!
      user = token_record.authenticatable

      new_access_token = generate_jwt_for(user)
      new_refresh = user.refresh_tokens.create!(
        ip_address: context[:request].remote_ip,
        user_agent: context[:request].user_agent
      )

      {
        access_token: new_access_token,
        refresh_token: new_refresh.raw_token,
        expires_in: jwt_expiration_time,
        errors: []
      }
    end

    private

    def generate_jwt_for(entity)
      secret = Rails.application.credentials.devise_jwt_secret_key!
      payload = entity.jwt_payload.merge(
        "jti" => SecureRandom.uuid,
        "iat" => Time.current.to_i,
        "exp" => Devise::JWT.config.expiration_time.seconds.from_now.to_i
      )
      JWT.encode(payload, secret, "HS256")
    end

    def jwt_expiration_time
      Devise::JWT.config.expiration_time
    end
  end
end
```

**Step 6: Create Logout mutation**

```ruby
# app/graphql/mutations/logout.rb
module Mutations
  class Logout < BaseMutation
    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve
      authenticate!

      # Decode current token to get jti
      token = context[:request].headers["Authorization"]&.split(" ")&.last
      if token
        secret = Rails.application.credentials.devise_jwt_secret_key!
        decoded = JWT.decode(token, secret, true, algorithm: "HS256")
        payload = decoded.first
        JwtDenylist.create!(jti: payload["jti"], exp: Time.at(payload["exp"]))
      end

      # Revoke all active refresh tokens
      current_user.refresh_tokens.active.find_each(&:revoke!)

      { success: true, errors: [] }
    end
  end
end
```

**Step 7: Register mutations in MutationType**

```ruby
# app/graphql/types/mutation_type.rb
module Types
  class MutationType < Types::BaseObject
    field :login, mutation: Mutations::Login
    field :register, mutation: Mutations::Register
    field :refresh_token, mutation: Mutations::RefreshToken
    field :logout, mutation: Mutations::Logout
  end
end
```

**Step 8: Run tests**

Run: `bin/rails test`
Expected: All 107 tests still pass

**Step 9: Commit**

```bash
git add -A && git commit -m "feat(graphql): add auth mutations (login, register, refresh, logout)"
```

---

### Task 4: Create all queries

**Files:**
- Modify: `app/graphql/types/query_type.rb`

**Step 1: Implement all queries**

```ruby
# app/graphql/types/query_type.rb
require "ostruct"

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ID], required: true, description: "IDs of the objects."
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

    field :classrooms, [Types::ClassroomType], null: false, description: "List classrooms for current teacher"

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
          period: "Week of #{week_start.strftime('%b %d')}",
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

    field :my_children, [Types::StudentType], null: false, description: "List children for current parent"

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
      raise GraphQL::ExecutionError, "Invalid user type" unless klass && [Teacher, Parent].include?(klass)
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
```

**Step 2: Create UserPermissionsType**

```ruby
# app/graphql/types/user_permissions_type.rb
module Types
  class UserPermissionsType < Types::BaseObject
    field :user_id, ID, null: false
    field :role, String, null: false
    field :overrides, [Types::PermissionType], null: false
    field :effective, GraphQL::Types::JSON, null: false
  end
end
```

**Step 3: Run tests**

Run: `bin/rails test`
Expected: All 107 tests still pass

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(graphql): add all queries (classrooms, students, radar, progress, permissions)"
```

---

### Task 5: Create data mutations (daily scores + admin permissions)

**Files:**
- Create: `app/graphql/types/create_daily_score_input_type.rb`
- Create: `app/graphql/types/update_daily_score_input_type.rb`
- Create: `app/graphql/types/daily_score_payload_type.rb`
- Create: `app/graphql/types/permission_payload_type.rb`
- Create: `app/graphql/types/delete_payload_type.rb`
- Create: `app/graphql/mutations/create_daily_score.rb`
- Create: `app/graphql/mutations/update_daily_score.rb`
- Create: `app/graphql/mutations/admin/grant_permission.rb`
- Create: `app/graphql/mutations/admin/revoke_permission.rb`
- Create: `app/graphql/mutations/admin/toggle_permission.rb`
- Create: `app/graphql/mutations/admin/delete_permission.rb`
- Modify: `app/graphql/types/mutation_type.rb`

**Step 1: Create input types**

```ruby
# app/graphql/types/create_daily_score_input_type.rb
module Types
  class CreateDailyScoreInputType < Types::BaseInputObject
    argument :student_id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :skill_category, Types::SkillCategoryEnum, required: true
    argument :score, Integer, required: true
    argument :notes, String, required: false
  end
end
```

```ruby
# app/graphql/types/update_daily_score_input_type.rb
module Types
  class UpdateDailyScoreInputType < Types::BaseInputObject
    argument :score, Integer, required: false
    argument :notes, String, required: false
  end
end
```

**Step 2: Create payload types**

```ruby
# app/graphql/types/daily_score_payload_type.rb
module Types
  class DailyScorePayloadType < Types::BaseObject
    field :daily_score, Types::DailyScoreType
    field :errors, [Types::UserErrorType], null: false
  end
end
```

```ruby
# app/graphql/types/permission_payload_type.rb
module Types
  class PermissionPayloadType < Types::BaseObject
    field :permission, Types::PermissionType
    field :errors, [Types::UserErrorType], null: false
  end
end
```

```ruby
# app/graphql/types/delete_payload_type.rb
module Types
  class DeletePayloadType < Types::BaseObject
    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false
  end
end
```

**Step 3: Create daily score mutations**

```ruby
# app/graphql/mutations/create_daily_score.rb
module Mutations
  class CreateDailyScore < BaseMutation
    argument :input, Types::CreateDailyScoreInputType, required: true

    field :daily_score, Types::DailyScoreType
    field :errors, [Types::UserErrorType], null: false

    def resolve(input:)
      authenticate!

      daily_score = DailyScore.new(input.to_h)
      daily_score.teacher = current_user

      student = Student.find(input.student_id)
      raise Pundit::NotAuthorizedError unless StudentPolicy.new(current_user, student).show?
      raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).create?

      if daily_score.save
        { daily_score: daily_score, errors: [] }
      else
        {
          daily_score: nil,
          errors: daily_score.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
        }
      end
    end
  end
end
```

```ruby
# app/graphql/mutations/update_daily_score.rb
module Mutations
  class UpdateDailyScore < BaseMutation
    argument :id, ID, required: true
    argument :input, Types::UpdateDailyScoreInputType, required: true

    field :daily_score, Types::DailyScoreType
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:, input:)
      authenticate!

      daily_score = DailyScore.find(id)
      raise Pundit::NotAuthorizedError unless DailyScorePolicy.new(current_user, daily_score).update?

      if daily_score.update(input.to_h.compact)
        { daily_score: daily_score, errors: [] }
      else
        {
          daily_score: nil,
          errors: daily_score.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
        }
      end
    end
  end
end
```

**Step 4: Create admin permission mutations**

```ruby
# app/graphql/mutations/admin/grant_permission.rb
module Mutations
  module Admin
    class GrantPermission < BaseMutation
      argument :user_id, ID, required: true
      argument :user_type, String, required: true, description: "Teacher or Parent"
      argument :resource, String, required: true
      argument :action, String, required: true

      field :permission, Types::PermissionType
      field :errors, [Types::UserErrorType], null: false

      def resolve(user_id:, user_type:, resource:, action:)
        authenticate!
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, Permission).create?

        klass = user_type.safe_constantize
        raise GraphQL::ExecutionError, "Invalid user type" unless klass && [Teacher, Parent].include?(klass)
        target_user = klass.find(user_id)

        permission = target_user.permissions.build(resource: resource, action: action, granted: true)

        if permission.save
          { permission: permission, errors: [] }
        else
          {
            permission: nil,
            errors: permission.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
          }
        end
      end
    end
  end
end
```

```ruby
# app/graphql/mutations/admin/revoke_permission.rb
module Mutations
  module Admin
    class RevokePermission < BaseMutation
      argument :user_id, ID, required: true
      argument :user_type, String, required: true, description: "Teacher or Parent"
      argument :resource, String, required: true
      argument :action, String, required: true

      field :permission, Types::PermissionType
      field :errors, [Types::UserErrorType], null: false

      def resolve(user_id:, user_type:, resource:, action:)
        authenticate!
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, Permission).create?

        klass = user_type.safe_constantize
        raise GraphQL::ExecutionError, "Invalid user type" unless klass && [Teacher, Parent].include?(klass)
        target_user = klass.find(user_id)

        permission = target_user.permissions.build(resource: resource, action: action, granted: false)

        if permission.save
          { permission: permission, errors: [] }
        else
          {
            permission: nil,
            errors: permission.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
          }
        end
      end
    end
  end
end
```

```ruby
# app/graphql/mutations/admin/toggle_permission.rb
module Mutations
  module Admin
    class TogglePermission < BaseMutation
      argument :id, ID, required: true

      field :permission, Types::PermissionType
      field :errors, [Types::UserErrorType], null: false

      def resolve(id:)
        authenticate!

        permission = Permission.find(id)
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, permission).update?

        if permission.update(granted: !permission.granted)
          { permission: permission, errors: [] }
        else
          {
            permission: nil,
            errors: permission.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } }
          }
        end
      end
    end
  end
end
```

```ruby
# app/graphql/mutations/admin/delete_permission.rb
module Mutations
  module Admin
    class DeletePermission < BaseMutation
      argument :id, ID, required: true

      field :success, Boolean, null: false
      field :errors, [Types::UserErrorType], null: false

      def resolve(id:)
        authenticate!

        permission = Permission.find(id)
        raise Pundit::NotAuthorizedError unless PermissionPolicy.new(current_user, permission).destroy?

        permission.destroy!
        { success: true, errors: [] }
      end
    end
  end
end
```

**Step 5: Update MutationType with all mutations**

```ruby
# app/graphql/types/mutation_type.rb
module Types
  class MutationType < Types::BaseObject
    # Auth
    field :login, mutation: Mutations::Login
    field :register, mutation: Mutations::Register
    field :refresh_token, mutation: Mutations::RefreshToken
    field :logout, mutation: Mutations::Logout

    # Daily Scores
    field :create_daily_score, mutation: Mutations::CreateDailyScore
    field :update_daily_score, mutation: Mutations::UpdateDailyScore

    # Admin Permissions
    field :grant_permission, mutation: Mutations::Admin::GrantPermission
    field :revoke_permission, mutation: Mutations::Admin::RevokePermission
    field :toggle_permission, mutation: Mutations::Admin::TogglePermission
    field :delete_permission, mutation: Mutations::Admin::DeletePermission
  end
end
```

**Step 6: Run tests**

Run: `bin/rails test`
Expected: All 107 tests still pass

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(graphql): add daily score and admin permission mutations"
```

---

### Task 6: Create GraphQL test helper and auth query tests

**Files:**
- Create: `test/support/graphql_test_helper.rb`
- Modify: `test/test_helper.rb`
- Create: `test/graphql/queries/me_query_test.rb`
- Create: `test/graphql/queries/classrooms_query_test.rb`
- Create: `test/graphql/queries/students_query_test.rb`

**Step 1: Create GraphQL test helper**

```ruby
# test/support/graphql_test_helper.rb
module GraphqlTestHelper
  def execute_query(query: nil, mutation: nil, variables: {}, user: nil)
    GrewmeSchema.execute(
      query || mutation,
      variables: variables.deep_stringify_keys,
      context: { current_user: user, request: OpenStruct.new(remote_ip: "127.0.0.1", user_agent: "test", headers: {}) }
    )
  end

  def gql_data(result)
    result["data"]
  end

  def gql_errors(result)
    result["errors"]
  end
end
```

**Step 2: Include helper in test_helper.rb**

Add to `test/test_helper.rb` inside the `ActiveSupport::TestCase` class:

```ruby
include GraphqlTestHelper
```

**Step 3: Create me query test**

```ruby
# test/graphql/queries/me_query_test.rb
require "test_helper"

class MeQueryTest < ActiveSupport::TestCase
  ME_QUERY = <<~GRAPHQL
    query {
      me {
        ... on Teacher { id name email role }
        ... on Parent { id name email role }
      }
    }
  GRAPHQL

  test "returns current teacher" do
    teacher = teachers(:john)
    result = execute_query(query: ME_QUERY, user: teacher)

    assert_nil gql_errors(result)
    data = gql_data(result)["me"]
    assert_equal teacher.name, data["name"]
    assert_equal "teacher", data["role"]
  end

  test "returns current parent" do
    parent = parents(:jane)
    result = execute_query(query: ME_QUERY, user: parent)

    assert_nil gql_errors(result)
    data = gql_data(result)["me"]
    assert_equal parent.name, data["name"]
    assert_equal "parent", data["role"]
  end

  test "errors when unauthenticated" do
    result = execute_query(query: ME_QUERY)
    assert_not_nil gql_errors(result)
    assert_match "Authentication required", gql_errors(result).first["message"]
  end
end
```

**Step 4: Create classrooms query test**

```ruby
# test/graphql/queries/classrooms_query_test.rb
require "test_helper"

class ClassroomsQueryTest < ActiveSupport::TestCase
  CLASSROOMS_QUERY = <<~GRAPHQL
    query { classrooms { id name studentCount } }
  GRAPHQL

  CLASSROOM_QUERY = <<~GRAPHQL
    query($id: ID!) { classroom(id: $id) { id name students { id name } } }
  GRAPHQL

  test "returns classrooms for teacher" do
    teacher = teachers(:john)
    result = execute_query(query: CLASSROOMS_QUERY, user: teacher)

    assert_nil gql_errors(result)
    assert_kind_of Array, gql_data(result)["classrooms"]
  end

  test "returns single classroom" do
    teacher = teachers(:john)
    classroom = classrooms(:first_grade)
    result = execute_query(query: CLASSROOM_QUERY, variables: { id: classroom.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    assert_equal classroom.name, gql_data(result)["classroom"]["name"]
  end

  test "errors when unauthenticated" do
    result = execute_query(query: CLASSROOMS_QUERY)
    assert_not_nil gql_errors(result)
  end
end
```

**Step 5: Create students query test**

```ruby
# test/graphql/queries/students_query_test.rb
require "test_helper"

class StudentsQueryTest < ActiveSupport::TestCase
  STUDENT_QUERY = <<~GRAPHQL
    query($id: ID!) { student(id: $id) { id name } }
  GRAPHQL

  RADAR_QUERY = <<~GRAPHQL
    query($studentId: ID!) {
      studentRadar(studentId: $studentId) {
        studentId studentName
        skills { reading math writing logic social }
      }
    }
  GRAPHQL

  PROGRESS_QUERY = <<~GRAPHQL
    query($studentId: ID!) {
      studentProgress(studentId: $studentId) {
        weeks { period skills { reading math writing logic social } }
      }
    }
  GRAPHQL

  test "returns student for authorized teacher" do
    teacher = teachers(:john)
    student = students(:alice)
    result = execute_query(query: STUDENT_QUERY, variables: { id: student.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    assert_equal student.name, gql_data(result)["student"]["name"]
  end

  test "returns radar data" do
    teacher = teachers(:john)
    student = students(:alice)
    result = execute_query(query: RADAR_QUERY, variables: { studentId: student.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    radar = gql_data(result)["studentRadar"]
    assert_equal student.id.to_s, radar["studentId"]
    assert radar["skills"].key?("reading")
  end

  test "returns progress data" do
    teacher = teachers(:john)
    student = students(:alice)
    result = execute_query(query: PROGRESS_QUERY, variables: { studentId: student.id.to_s }, user: teacher)

    assert_nil gql_errors(result)
    weeks = gql_data(result)["studentProgress"]["weeks"]
    assert_equal 5, weeks.length
  end

  test "errors when unauthenticated" do
    student = students(:alice)
    result = execute_query(query: STUDENT_QUERY, variables: { id: student.id.to_s })
    assert_not_nil gql_errors(result)
  end
end
```

**Step 6: Run all tests**

Run: `bin/rails test`
Expected: All existing + new GraphQL tests pass

**Step 7: Commit**

```bash
git add -A && git commit -m "test(graphql): add query tests for me, classrooms, students, radar, progress"
```

---

### Task 7: Create mutation tests

**Files:**
- Create: `test/graphql/mutations/login_test.rb`
- Create: `test/graphql/mutations/create_daily_score_test.rb`
- Create: `test/graphql/mutations/admin_permissions_test.rb`

**Step 1: Create login mutation test**

```ruby
# test/graphql/mutations/login_test.rb
require "test_helper"

class LoginMutationTest < ActiveSupport::TestCase
  LOGIN_MUTATION = <<~GRAPHQL
    mutation($email: String!, $password: String!, $role: String!) {
      login(email: $email, password: $password, role: $role) {
        accessToken refreshToken expiresIn
        user { ... on Teacher { id name role } }
        errors { message path }
      }
    }
  GRAPHQL

  test "logs in teacher with valid credentials" do
    teacher = teachers(:john)
    result = execute_query(
      mutation: LOGIN_MUTATION,
      variables: { email: teacher.email, password: "password", role: "teacher" }
    )

    data = gql_data(result)["login"]
    assert_empty data["errors"]
    assert_not_nil data["accessToken"]
    assert_not_nil data["refreshToken"]
    assert_equal teacher.name, data["user"]["name"]
  end

  test "returns error with invalid credentials" do
    result = execute_query(
      mutation: LOGIN_MUTATION,
      variables: { email: "wrong@example.com", password: "wrong", role: "teacher" }
    )

    data = gql_data(result)["login"]
    assert_not_empty data["errors"]
    assert_match "Invalid email or password", data["errors"].first["message"]
  end
end
```

**Step 2: Create daily score mutation test**

```ruby
# test/graphql/mutations/create_daily_score_test.rb
require "test_helper"

class CreateDailyScoreMutationTest < ActiveSupport::TestCase
  CREATE_MUTATION = <<~GRAPHQL
    mutation($input: CreateDailyScoreInput!) {
      createDailyScore(input: $input) {
        dailyScore { id score skillCategory date }
        errors { message path }
      }
    }
  GRAPHQL

  UPDATE_MUTATION = <<~GRAPHQL
    mutation($id: ID!, $input: UpdateDailyScoreInput!) {
      updateDailyScore(id: $id, input: $input) {
        dailyScore { id score }
        errors { message path }
      }
    }
  GRAPHQL

  test "creates daily score" do
    teacher = teachers(:john)
    student = students(:alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: Date.today.iso8601,
          skillCategory: "READING",
          score: 85
        }
      },
      user: teacher
    )

    data = gql_data(result)["createDailyScore"]
    assert_empty data["errors"]
    assert_equal 85, data["dailyScore"]["score"]
  end

  test "returns errors for invalid score" do
    teacher = teachers(:john)
    student = students(:alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: Date.today.iso8601,
          skillCategory: "READING",
          score: 999
        }
      },
      user: teacher
    )

    data = gql_data(result)["createDailyScore"]
    assert_nil data["dailyScore"]
    assert_not_empty data["errors"]
  end

  test "errors when unauthenticated" do
    student = students(:alice)
    result = execute_query(
      mutation: CREATE_MUTATION,
      variables: {
        input: {
          studentId: student.id.to_s,
          date: Date.today.iso8601,
          skillCategory: "READING",
          score: 85
        }
      }
    )

    assert_not_nil gql_errors(result)
  end
end
```

**Step 3: Create admin permissions mutation test**

```ruby
# test/graphql/mutations/admin_permissions_test.rb
require "test_helper"

class AdminPermissionsMutationTest < ActiveSupport::TestCase
  GRANT_MUTATION = <<~GRAPHQL
    mutation($userId: ID!, $userType: String!, $resource: String!, $action: String!) {
      grantPermission(userId: $userId, userType: $userType, resource: $resource, action: $action) {
        permission { id resource action granted }
        errors { message path }
      }
    }
  GRAPHQL

  DELETE_MUTATION = <<~GRAPHQL
    mutation($id: ID!) {
      deletePermission(id: $id) {
        success
        errors { message path }
      }
    }
  GRAPHQL

  test "admin grants permission" do
    admin = teachers(:admin)
    teacher = teachers(:john)
    result = execute_query(
      mutation: GRANT_MUTATION,
      variables: {
        userId: teacher.id.to_s,
        userType: "Teacher",
        resource: "students",
        action: "create"
      },
      user: admin
    )

    data = gql_data(result)["grantPermission"]
    assert_empty data["errors"]
    assert data["permission"]["granted"]
  end

  test "non-admin cannot grant permission" do
    teacher = teachers(:john)
    result = execute_query(
      mutation: GRANT_MUTATION,
      variables: {
        userId: teacher.id.to_s,
        userType: "Teacher",
        resource: "students",
        action: "create"
      },
      user: teacher
    )

    assert_not_nil gql_errors(result)
  end
end
```

**Step 4: Run all tests**

Run: `bin/rails test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A && git commit -m "test(graphql): add mutation tests for login, daily scores, admin permissions"
```

---

### Task 8: Remove REST API layer

**Files:**
- Delete: `app/controllers/api/v1/base_controller.rb`
- Delete: `app/controllers/api/v1/classrooms_controller.rb`
- Delete: `app/controllers/api/v1/students_controller.rb`
- Delete: `app/controllers/api/v1/daily_scores_controller.rb`
- Delete: `app/controllers/api/v1/teachers/auth_controller.rb`
- Delete: `app/controllers/api/v1/parents/auth_controller.rb`
- Delete: `app/controllers/api/v1/parents/children_controller.rb`
- Delete: `app/controllers/api/v1/classrooms/students_controller.rb`
- Delete: `app/controllers/api/v1/students/daily_scores_controller.rb`
- Delete: `app/controllers/api/v1/admin/permissions_controller.rb`
- Delete: `app/resources/teacher_resource.rb`
- Delete: `app/resources/parent_resource.rb`
- Delete: `app/resources/student_resource.rb`
- Delete: `app/resources/classroom_resource.rb`
- Delete: `app/resources/daily_score_resource.rb`
- Delete: `app/resources/radar_data_resource.rb`
- Delete: `app/resources/progress_data_resource.rb`
- Delete: `app/resources/permission_resource.rb`
- Delete: `test/controllers/` (all REST controller tests)
- Modify: `config/routes.rb`
- Modify: `Gemfile` (remove alba gem)

**Step 1: Remove REST controllers**

Run:
```bash
rm -rf app/controllers/api/v1/base_controller.rb \
  app/controllers/api/v1/classrooms_controller.rb \
  app/controllers/api/v1/students_controller.rb \
  app/controllers/api/v1/daily_scores_controller.rb \
  app/controllers/api/v1/teachers/ \
  app/controllers/api/v1/parents/ \
  app/controllers/api/v1/classrooms/ \
  app/controllers/api/v1/students/ \
  app/controllers/api/v1/admin/
```

**Step 2: Remove Alba serializers**

Run:
```bash
rm -rf app/resources/teacher_resource.rb \
  app/resources/parent_resource.rb \
  app/resources/student_resource.rb \
  app/resources/classroom_resource.rb \
  app/resources/daily_score_resource.rb \
  app/resources/radar_data_resource.rb \
  app/resources/progress_data_resource.rb \
  app/resources/permission_resource.rb
```

**Step 3: Remove REST controller tests**

Run:
```bash
rm -rf test/controllers/
```

**Step 4: Update routes.rb**

Replace `config/routes.rb` with:

```ruby
Rails.application.routes.draw do
  # Avo admin panel
  mount_avo

  # Avo admin authentication
  get "avo/sign_in", to: "avo/sessions#new"
  post "avo/sign_in", to: "avo/sessions#create"
  delete "avo/sign_out", to: "avo/sessions#destroy"

  # GraphQL API
  post "/graphql", to: "graphql#execute"

  get "up" => "rails/health#show", :as => :rails_health_check
end
```

**Step 5: Remove alba gem from Gemfile**

Remove this line from Gemfile:
```ruby
gem "alba", "~> 3.9"
```

**Step 6: Run bundle install**

Run: `bundle install`

**Step 7: Run all tests**

Run: `bin/rails test`
Expected: All GraphQL tests pass, no REST controller tests remain

**Step 8: Run RuboCop**

Run: `bin/rubocop`
Expected: No offenses

**Step 9: Commit**

```bash
git add -A && git commit -m "refactor(graphql): remove REST controllers, Alba serializers, and REST routes"
```

---

### Task 9: Verify end-to-end with manual GraphQL queries

**Step 1: Start Rails server**

Run: `bin/rails server`

**Step 2: Test login mutation**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(email: \"teacher@example.com\", password: \"password\", role: \"teacher\") { accessToken errors { message } } }"}'
```

Expected: Returns `accessToken` or appropriate error

**Step 3: Test authenticated query**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_from_step_2>" \
  -d '{"query": "{ me { ... on Teacher { id name role } } }"}'
```

Expected: Returns current user data

**Step 4: Commit final verification**

```bash
git add -A && git commit -m "docs(graphql): migration complete — all REST endpoints replaced with GraphQL"
```
