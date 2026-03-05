# Parent Feed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Facebook-style feed to the parent dashboard where teachers post text/image/video updates per classroom, and parents can like, comment, and share posts.

**Architecture:** New `FeedPost`, `FeedPostLike`, `FeedPostComment` models with Active Storage media attachments. GraphQL queries/mutations for CRUD + interactions. SvelteKit BFF proxy for file uploads. S3-compatible storage (Minio local, S3 production).

**Tech Stack:** Rails 8.1 + Active Storage + aws-sdk-s3, GraphQL mutations/queries, SvelteKit frontend with server-side load functions.

---

### Task 1: Active Storage S3 Configuration

**Files:**
- Modify: `backend/Gemfile`
- Modify: `backend/config/storage.yml`
- Modify: `backend/config/environments/development.rb:30`

**Step 1: Add aws-sdk-s3 gem**

In `backend/Gemfile`, add after the `image_processing` gem (or at end of gems):

```ruby
gem "aws-sdk-s3", require: false
```

Run: `bundle install`

**Step 2: Configure storage.yml for S3-compatible**

Replace the commented `amazon:` block in `backend/config/storage.yml`:

```yaml
amazon:
  service: S3
  access_key_id: <%= ENV.fetch("S3_ACCESS_KEY_ID", "minioadmin") %>
  secret_access_key: <%= ENV.fetch("S3_SECRET_ACCESS_KEY", "minioadmin") %>
  region: <%= ENV.fetch("S3_REGION", "us-east-1") %>
  bucket: <%= ENV.fetch("S3_BUCKET", "grewme-dev") %>
  endpoint: <%= ENV.fetch("S3_ENDPOINT", "http://localhost:9000") %>
  force_path_style: true
```

**Step 3: Switch development to amazon service**

In `backend/config/environments/development.rb`, change:
```ruby
config.active_storage.service = :amazon
```

**Step 4: Add Docker Compose for Minio**

Create `docker-compose.yml` in project root:

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

**Step 5: Start Minio and create bucket**

```bash
docker compose up -d minio
# Wait for Minio to start, then create bucket:
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/grewme-dev
```

Or via Minio console at http://localhost:9001 (login: minioadmin/minioadmin), create bucket `grewme-dev`.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(storage): configure Active Storage with S3-compatible backend (Minio)"
```

---

### Task 2: Database Migrations

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_feed_posts.rb`
- Create: `backend/db/migrate/TIMESTAMP_create_feed_post_likes.rb`
- Create: `backend/db/migrate/TIMESTAMP_create_feed_post_comments.rb`

**Step 1: Generate migrations**

```bash
cd backend
bin/rails generate migration CreateFeedPosts teacher:references classroom:references body:text likes_count:integer comments_count:integer
bin/rails generate migration CreateFeedPostLikes feed_post:references liker_type:string liker_id:bigint
bin/rails generate migration CreateFeedPostComments feed_post:references commenter_type:string commenter_id:bigint body:text
```

**Step 2: Edit feed_posts migration**

Ensure `likes_count` and `comments_count` default to 0, and `body` is `null: false`:

```ruby
class CreateFeedPosts < ActiveRecord::Migration[8.1]
  def change
    create_table :feed_posts do |t|
      t.references :teacher, null: false, foreign_key: true
      t.references :classroom, null: false, foreign_key: true
      t.text :body, null: false
      t.integer :likes_count, default: 0, null: false
      t.integer :comments_count, default: 0, null: false
      t.timestamps
    end

    add_index :feed_posts, [:classroom_id, :created_at]
  end
end
```

**Step 3: Edit feed_post_likes migration**

```ruby
class CreateFeedPostLikes < ActiveRecord::Migration[8.1]
  def change
    create_table :feed_post_likes do |t|
      t.references :feed_post, null: false, foreign_key: true
      t.string :liker_type, null: false
      t.bigint :liker_id, null: false
      t.timestamp :created_at, null: false
    end

    add_index :feed_post_likes, [:feed_post_id, :liker_type, :liker_id], unique: true, name: "idx_feed_post_likes_unique"
    add_index :feed_post_likes, [:liker_type, :liker_id]
  end
end
```

**Step 4: Edit feed_post_comments migration**

```ruby
class CreateFeedPostComments < ActiveRecord::Migration[8.1]
  def change
    create_table :feed_post_comments do |t|
      t.references :feed_post, null: false, foreign_key: true
      t.string :commenter_type, null: false
      t.bigint :commenter_id, null: false
      t.text :body, null: false
      t.timestamps
    end

    add_index :feed_post_comments, [:feed_post_id, :created_at]
  end
end
```

**Step 5: Run migrations**

```bash
bin/rails db:migrate
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(feed): add feed_posts, feed_post_likes, feed_post_comments tables"
```

---

### Task 3: Models

**Files:**
- Create: `backend/app/models/feed_post.rb`
- Create: `backend/app/models/feed_post_like.rb`
- Create: `backend/app/models/feed_post_comment.rb`
- Modify: `backend/app/models/teacher.rb` — add `has_many :feed_posts`
- Modify: `backend/app/models/classroom.rb` — add `has_many :feed_posts`

**Step 1: Write model tests**

Create `backend/test/models/feed_post_test.rb`:

```ruby
require "test_helper"

class FeedPostTest < ActiveSupport::TestCase
  test "valid feed post" do
    post = FeedPost.new(
      teacher: teachers(:alice),
      classroom: classrooms(:class_1a),
      body: "Great day in class!"
    )
    assert post.valid?
  end

  test "requires body" do
    post = FeedPost.new(teacher: teachers(:alice), classroom: classrooms(:class_1a))
    assert_not post.valid?
    assert_includes post.errors[:body], "can't be blank"
  end

  test "requires teacher" do
    post = FeedPost.new(classroom: classrooms(:class_1a), body: "Hello")
    assert_not post.valid?
  end

  test "requires classroom" do
    post = FeedPost.new(teacher: teachers(:alice), body: "Hello")
    assert_not post.valid?
  end
end
```

Create `backend/test/models/feed_post_like_test.rb`:

```ruby
require "test_helper"

class FeedPostLikeTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")
  end

  test "can like a post" do
    like = FeedPostLike.create!(feed_post: @post, liker: parents(:carol))
    assert like.persisted?
  end

  test "cannot like same post twice" do
    FeedPostLike.create!(feed_post: @post, liker: parents(:carol))
    duplicate = FeedPostLike.new(feed_post: @post, liker: parents(:carol))
    assert_not duplicate.valid?
  end

  test "increments likes_count" do
    assert_difference -> { @post.reload.likes_count }, 1 do
      FeedPostLike.create!(feed_post: @post, liker: parents(:carol))
    end
  end
end
```

Create `backend/test/models/feed_post_comment_test.rb`:

```ruby
require "test_helper"

class FeedPostCommentTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")
  end

  test "valid comment" do
    comment = FeedPostComment.new(feed_post: @post, commenter: parents(:carol), body: "Nice!")
    assert comment.valid?
  end

  test "requires body" do
    comment = FeedPostComment.new(feed_post: @post, commenter: parents(:carol))
    assert_not comment.valid?
  end

  test "increments comments_count" do
    assert_difference -> { @post.reload.comments_count }, 1 do
      FeedPostComment.create!(feed_post: @post, commenter: parents(:carol), body: "Great!")
    end
  end
end
```

**Step 2: Run tests to verify they fail**

```bash
bin/rails test test/models/feed_post_test.rb test/models/feed_post_like_test.rb test/models/feed_post_comment_test.rb
```

Expected: FAIL (models don't exist yet)

**Step 3: Create models**

`backend/app/models/feed_post.rb`:

```ruby
class FeedPost < ApplicationRecord
  belongs_to :teacher
  belongs_to :classroom
  has_many_attached :media
  has_many :likes, class_name: "FeedPostLike", dependent: :destroy
  has_many :comments, class_name: "FeedPostComment", dependent: :destroy

  validates :body, presence: true

  scope :for_classrooms, ->(ids) { where(classroom_id: ids).order(created_at: :desc) }
end
```

`backend/app/models/feed_post_like.rb`:

```ruby
class FeedPostLike < ApplicationRecord
  belongs_to :feed_post, counter_cache: :likes_count
  belongs_to :liker, polymorphic: true

  validates :liker_id, uniqueness: { scope: [:feed_post_id, :liker_type] }
end
```

`backend/app/models/feed_post_comment.rb`:

```ruby
class FeedPostComment < ApplicationRecord
  belongs_to :feed_post, counter_cache: :comments_count
  belongs_to :commenter, polymorphic: true

  validates :body, presence: true
end
```

**Step 4: Add associations to existing models**

In `backend/app/models/teacher.rb`, add:
```ruby
has_many :feed_posts, dependent: :destroy
```

In `backend/app/models/classroom.rb`, add:
```ruby
has_many :feed_posts, dependent: :destroy
```

**Step 5: Run tests**

```bash
bin/rails test test/models/feed_post_test.rb test/models/feed_post_like_test.rb test/models/feed_post_comment_test.rb
```

Expected: ALL PASS

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(feed): add FeedPost, FeedPostLike, FeedPostComment models with tests"
```

---

### Task 4: Feed Post Policy

**Files:**
- Create: `backend/app/policies/feed_post_policy.rb`
- Create: `backend/test/policies/feed_post_policy_test.rb`

**Step 1: Write policy test**

```ruby
require "test_helper"

class FeedPostPolicyTest < ActiveSupport::TestCase
  setup do
    @post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")
  end

  test "teacher in classroom can create" do
    policy = FeedPostPolicy.new(teachers(:alice), FeedPost.new(classroom: classrooms(:class_1a)))
    assert policy.create?
  end

  test "teacher not in classroom cannot create" do
    # bob is not primary in class_1a (he's assistant — check if that counts)
    # For safety, test with a teacher who has no classroom
    other = Teacher.create!(name: "Other", email: "other@test.com", password: "password123", school: schools(:greenwood))
    policy = FeedPostPolicy.new(other, FeedPost.new(classroom: classrooms(:class_1a)))
    assert_not policy.create?
  end

  test "author can destroy own post" do
    policy = FeedPostPolicy.new(teachers(:alice), @post)
    assert policy.destroy?
  end

  test "non-author cannot destroy" do
    policy = FeedPostPolicy.new(teachers(:bob), @post)
    assert_not policy.destroy?
  end

  test "parent with child in classroom can view" do
    policy = FeedPostPolicy.new(parents(:carol), @post)
    assert policy.show?
  end

  test "parent without child in classroom cannot view" do
    # eve's child (Ava) is in class_2b, not class_1a
    policy = FeedPostPolicy.new(parents(:eve), @post)
    assert_not policy.show?
  end
end
```

**Step 2: Run test to verify it fails**

```bash
bin/rails test test/policies/feed_post_policy_test.rb
```

**Step 3: Create policy**

`backend/app/policies/feed_post_policy.rb`:

```ruby
class FeedPostPolicy < ApplicationPolicy
  def show?
    return true if user.teacher?
    return false unless user.parent?

    # Parent can see posts from classrooms where their child is enrolled
    user.children
        .joins(:classroom_students)
        .where(classroom_students: { classroom_id: record.classroom_id, active: true })
        .exists?
  end

  def create?
    user.teacher? && user.classrooms.exists?(id: record.classroom_id)
  end

  def destroy?
    user.teacher? && record.teacher_id == user.id
  end

  def like?
    show?
  end

  def comment?
    show?
  end
end
```

**Step 4: Run tests**

```bash
bin/rails test test/policies/feed_post_policy_test.rb
```

Expected: ALL PASS (adjust if fixture data doesn't match assumptions — check `parents(:eve)` child classroom)

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(feed): add FeedPostPolicy with authorization rules and tests"
```

---

### Task 5: GraphQL Types for Feed

**Files:**
- Create: `backend/app/graphql/types/feed_post_type.rb`
- Create: `backend/app/graphql/types/feed_post_comment_type.rb`

**Step 1: Create FeedPostType**

`backend/app/graphql/types/feed_post_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class FeedPostType < Types::BaseObject
    field :id, ID, null: false
    field :body, String, null: false
    field :teacher, Types::TeacherType, null: false
    field :classroom, Types::ClassroomType, null: false
    field :media_urls, [String], null: false
    field :likes_count, Integer, null: false
    field :comments_count, Integer, null: false
    field :liked_by_me, Boolean, null: false
    field :comments, [Types::FeedPostCommentType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def media_urls
      object.media.map do |attachment|
        Rails.application.routes.url_helpers.rails_blob_url(attachment, host: ENV.fetch("APP_HOST", "http://localhost:3004"))
      end
    end

    def liked_by_me
      return false unless context[:current_user]
      object.likes.exists?(liker: context[:current_user])
    end

    def comments
      object.comments.order(created_at: :asc).includes(:commenter)
    end
  end
end
```

**Step 2: Create FeedPostCommentType**

`backend/app/graphql/types/feed_post_comment_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class FeedPostCommentType < Types::BaseObject
    field :id, ID, null: false
    field :body, String, null: false
    field :commenter_name, String, null: false
    field :commenter_type, String, null: false
    field :commenter_id, ID, null: false
    field :is_mine, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false

    def commenter_name
      object.commenter.name
    end

    def is_mine
      return false unless context[:current_user]
      object.commenter == context[:current_user]
    end
  end
end
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(feed): add FeedPostType and FeedPostCommentType GraphQL types"
```

---

### Task 6: GraphQL Queries

**Files:**
- Modify: `backend/app/graphql/types/query_type.rb`
- Create: `backend/test/graphql/queries/feed_posts_test.rb`

**Step 1: Write query tests**

`backend/test/graphql/queries/feed_posts_test.rb`:

```ruby
require "test_helper"

class FeedPostsQueryTest < ActiveSupport::TestCase
  include GraphqlTestHelper

  setup do
    @post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Hello parents!")
    FeedPostComment.create!(feed_post: @post, commenter: parents(:carol), body: "Thanks!")
  end

  test "parent can query feed posts for their children's classrooms" do
    result = execute_graphql(
      query: "query { feedPosts { nodes { id body teacher { name } likesCount commentsCount } } }",
      context: { current_user: parents(:carol) }
    )

    posts = result.dig("data", "feedPosts", "nodes")
    assert_equal 1, posts.length
    assert_equal "Hello parents!", posts[0]["body"]
    assert_equal "Alice Teacher", posts[0]["teacher"]["name"]
  end

  test "parent cannot see posts from other classrooms" do
    # eve's child is in class_2b, post is in class_1a
    result = execute_graphql(
      query: "query { feedPosts { nodes { id } } }",
      context: { current_user: parents(:eve) }
    )

    posts = result.dig("data", "feedPosts", "nodes")
    assert_equal 0, posts.length
  end

  test "single feed post query" do
    result = execute_graphql(
      query: "query($id: ID!) { feedPost(id: $id) { id body comments { body commenterName } } }",
      variables: { id: @post.id.to_s },
      context: { current_user: parents(:carol) }
    )

    post = result.dig("data", "feedPost")
    assert_equal "Hello parents!", post["body"]
    assert_equal 1, post["comments"].length
    assert_equal "Thanks!", post["comments"][0]["body"]
  end
end
```

**Step 2: Run tests to verify they fail**

```bash
bin/rails test test/graphql/queries/feed_posts_test.rb
```

**Step 3: Add queries to QueryType**

Add to `backend/app/graphql/types/query_type.rb`:

```ruby
# === Feed ===

field :feed_posts, Types::FeedPostType.connection_type, null: false, description: "Feed posts for parent's classrooms" do
  argument :classroom_ids, [ID], required: false
end

def feed_posts(classroom_ids: nil)
  authenticate!

  if current_user.parent?
    child_classroom_ids = current_user.children
      .joins(:classroom_students)
      .where(classroom_students: { active: true })
      .pluck("classroom_students.classroom_id")
      .uniq

    ids = classroom_ids ? (classroom_ids.map(&:to_i) & child_classroom_ids) : child_classroom_ids
  elsif current_user.teacher?
    ids = classroom_ids || current_user.classroom_ids
  else
    ids = []
  end

  FeedPost.where(classroom_id: ids).order(created_at: :desc).includes(:teacher, :classroom)
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
```

**Step 4: Run tests**

```bash
bin/rails test test/graphql/queries/feed_posts_test.rb
```

Expected: ALL PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(feed): add feedPosts and feedPost GraphQL queries with tests"
```

---

### Task 7: GraphQL Mutations (Create, Delete, Like, Comment)

**Files:**
- Create: `backend/app/graphql/mutations/create_feed_post.rb`
- Create: `backend/app/graphql/mutations/delete_feed_post.rb`
- Create: `backend/app/graphql/mutations/like_feed_post.rb`
- Create: `backend/app/graphql/mutations/comment_on_feed_post.rb`
- Create: `backend/app/graphql/mutations/delete_feed_comment.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`
- Create: `backend/test/graphql/mutations/feed_posts_test.rb`

**Step 1: Write mutation tests**

`backend/test/graphql/mutations/feed_posts_test.rb`:

```ruby
require "test_helper"

class FeedPostMutationsTest < ActiveSupport::TestCase
  include GraphqlTestHelper

  test "teacher creates feed post" do
    result = execute_graphql(
      query: 'mutation($classroomId: ID!, $body: String!) {
        createFeedPost(classroomId: $classroomId, body: $body) {
          feedPost { id body }
          errors { message }
        }
      }',
      variables: { classroomId: classrooms(:class_1a).id.to_s, body: "Great day!" },
      context: { current_user: teachers(:alice) }
    )

    post = result.dig("data", "createFeedPost", "feedPost")
    assert_not_nil post
    assert_equal "Great day!", post["body"]
  end

  test "parent cannot create feed post" do
    result = execute_graphql(
      query: 'mutation($classroomId: ID!, $body: String!) {
        createFeedPost(classroomId: $classroomId, body: $body) {
          feedPost { id }
          errors { message }
        }
      }',
      variables: { classroomId: classrooms(:class_1a).id.to_s, body: "Hello" },
      context: { current_user: parents(:carol) }
    )

    assert_includes result.dig("errors")&.map { |e| e["message"] } || [], "Not authorized"
  end

  test "parent likes a post" do
    post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")

    result = execute_graphql(
      query: 'mutation($id: ID!) { likeFeedPost(id: $id) { feedPost { id likesCount likedByMe } } }',
      variables: { id: post.id.to_s },
      context: { current_user: parents(:carol) }
    )

    data = result.dig("data", "likeFeedPost", "feedPost")
    assert_equal 1, data["likesCount"]
    assert_equal true, data["likedByMe"]
  end

  test "parent unlikes a post (toggle)" do
    post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")
    FeedPostLike.create!(feed_post: post, liker: parents(:carol))

    result = execute_graphql(
      query: 'mutation($id: ID!) { likeFeedPost(id: $id) { feedPost { id likesCount likedByMe } } }',
      variables: { id: post.id.to_s },
      context: { current_user: parents(:carol) }
    )

    data = result.dig("data", "likeFeedPost", "feedPost")
    assert_equal 0, data["likesCount"]
    assert_equal false, data["likedByMe"]
  end

  test "parent comments on a post" do
    post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")

    result = execute_graphql(
      query: 'mutation($id: ID!, $body: String!) {
        commentOnFeedPost(id: $id, body: $body) {
          comment { id body commenterName }
        }
      }',
      variables: { id: post.id.to_s, body: "Nice work!" },
      context: { current_user: parents(:carol) }
    )

    comment = result.dig("data", "commentOnFeedPost", "comment")
    assert_equal "Nice work!", comment["body"]
    assert_equal "Carol Parent", comment["commenterName"]
  end

  test "teacher deletes own post" do
    post = FeedPost.create!(teacher: teachers(:alice), classroom: classrooms(:class_1a), body: "Test")

    result = execute_graphql(
      query: 'mutation($id: ID!) { deleteFeedPost(id: $id) { success } }',
      variables: { id: post.id.to_s },
      context: { current_user: teachers(:alice) }
    )

    assert_equal true, result.dig("data", "deleteFeedPost", "success")
    assert_nil FeedPost.find_by(id: post.id)
  end
end
```

**Step 2: Run tests to verify they fail**

```bash
bin/rails test test/graphql/mutations/feed_posts_test.rb
```

**Step 3: Create mutations**

`backend/app/graphql/mutations/create_feed_post.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class CreateFeedPost < BaseMutation
    argument :classroom_id, ID, required: true
    argument :body, String, required: true
    argument :signed_blob_ids, [String], required: false

    field :feed_post, Types::FeedPostType
    field :errors, [Types::UserErrorType], null: false

    def resolve(classroom_id:, body:, signed_blob_ids: [])
      authenticate!

      post = FeedPost.new(teacher: current_user, classroom_id: classroom_id, body: body)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).create?

      if post.save
        if signed_blob_ids.present?
          post.media.attach(signed_blob_ids.map { |id| ActiveStorage::Blob.find_signed!(id) })
        end
        { feed_post: post, errors: [] }
      else
        { feed_post: nil, errors: post.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

`backend/app/graphql/mutations/delete_feed_post.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class DeleteFeedPost < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:)
      authenticate!
      post = FeedPost.find(id)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).destroy?

      post.destroy!
      { success: true, errors: [] }
    end
  end
end
```

`backend/app/graphql/mutations/like_feed_post.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class LikeFeedPost < BaseMutation
    argument :id, ID, required: true

    field :feed_post, Types::FeedPostType, null: false

    def resolve(id:)
      authenticate!
      post = FeedPost.find(id)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).like?

      existing = post.likes.find_by(liker: current_user)
      if existing
        existing.destroy!
      else
        post.likes.create!(liker: current_user)
      end

      { feed_post: post.reload }
    end
  end
end
```

`backend/app/graphql/mutations/comment_on_feed_post.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class CommentOnFeedPost < BaseMutation
    argument :id, ID, required: true
    argument :body, String, required: true

    field :comment, Types::FeedPostCommentType
    field :errors, [Types::UserErrorType], null: false

    def resolve(id:, body:)
      authenticate!
      post = FeedPost.find(id)
      raise Pundit::NotAuthorizedError unless FeedPostPolicy.new(current_user, post).comment?

      comment = post.comments.build(commenter: current_user, body: body)
      if comment.save
        { comment: comment, errors: [] }
      else
        { comment: nil, errors: comment.errors.map { |e| { message: e.full_message, path: [e.attribute.to_s.camelize(:lower)] } } }
      end
    end
  end
end
```

`backend/app/graphql/mutations/delete_feed_comment.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class DeleteFeedComment < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false

    def resolve(id:)
      authenticate!
      comment = FeedPostComment.find(id)
      raise Pundit::NotAuthorizedError unless comment.commenter == current_user

      comment.destroy!
      { success: true }
    end
  end
end
```

**Step 4: Register mutations in MutationType**

Add to `backend/app/graphql/types/mutation_type.rb`:

```ruby
field :create_feed_post, mutation: Mutations::CreateFeedPost
field :delete_feed_post, mutation: Mutations::DeleteFeedPost
field :like_feed_post, mutation: Mutations::LikeFeedPost
field :comment_on_feed_post, mutation: Mutations::CommentOnFeedPost
field :delete_feed_comment, mutation: Mutations::DeleteFeedComment
```

**Step 5: Run tests**

```bash
bin/rails test test/graphql/mutations/feed_posts_test.rb
```

Expected: ALL PASS

**Step 6: Run full test suite**

```bash
bin/rails test
```

Expected: ALL PASS (no regressions)

**Step 7: Commit**

```bash
git add -A && git commit -m "feat(feed): add GraphQL mutations for create/delete/like/comment with tests"
```

---

### Task 8: Seed Data for Feed

**Files:**
- Modify: `backend/db/seeds.rb`

**Step 1: Add feed posts to seeds**

Append to `backend/db/seeds.rb`:

```ruby
# Feed posts
post1 = FeedPost.create!(teacher: teacher1, classroom: class1a, body: "Today we practiced reading comprehension with a fun story about space explorers! The kids were so engaged. 🚀📚")
post2 = FeedPost.create!(teacher: teacher1, classroom: class1a, body: "Math quiz results are in! Everyone improved from last week. Keep up the great work! 🎉")
post3 = FeedPost.create!(teacher: teacher2, classroom: class2b, body: "We started our new science project today. The students are building model volcanoes! 🌋")
post4 = FeedPost.create!(teacher: teacher1, classroom: class1a, body: "Reminder: Parent-teacher conference next Friday. Looking forward to meeting everyone!")

# Feed post likes
FeedPostLike.create!(feed_post: post1, liker: parent1)
FeedPostLike.create!(feed_post: post1, liker: parent2)
FeedPostLike.create!(feed_post: post2, liker: parent1)

# Feed post comments
FeedPostComment.create!(feed_post: post1, commenter: parent1, body: "Emma loved the space story! She kept talking about it at dinner 😊")
FeedPostComment.create!(feed_post: post1, commenter: parent2, body: "Liam too! Can we get the book title?")
FeedPostComment.create!(feed_post: post1, commenter: teacher1, body: "The book is 'Mousetronaut' by Mark Kelly! Great for bedtime reading.")
FeedPostComment.create!(feed_post: post2, commenter: parent1, body: "So proud of the kids!")

puts "Seeded: #{FeedPost.count} feed posts, #{FeedPostLike.count} likes, #{FeedPostComment.count} comments"
```

**Step 2: Re-seed**

```bash
bin/rails db:seed:replant
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(feed): add feed post seed data"
```

---

### Task 9: Frontend — GraphQL Queries & Types

**Files:**
- Modify: `front-end/src/lib/api/types.ts`
- Create: `front-end/src/lib/api/queries/feed.ts`

**Step 1: Add TypeScript types**

Append to `front-end/src/lib/api/types.ts`:

```typescript
// === Feed ===
export interface FeedPost {
  id: string;
  body: string;
  teacher: { name: string };
  classroom: { id: string; name: string };
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: FeedPostComment[];
  createdAt: string;
}

export interface FeedPostComment {
  id: string;
  body: string;
  commenterName: string;
  commenterType: string;
  commenterId: string;
  isMine: boolean;
  createdAt: string;
}
```

**Step 2: Create feed queries**

`front-end/src/lib/api/queries/feed.ts`:

```typescript
export const FEED_POSTS_QUERY = `
  query FeedPosts($classroomIds: [ID!], $first: Int, $after: String) {
    feedPosts(classroomIds: $classroomIds, first: $first, after: $after) {
      nodes {
        id
        body
        teacher { name }
        classroom { id name }
        mediaUrls
        likesCount
        commentsCount
        likedByMe
        createdAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const FEED_POST_QUERY = `
  query FeedPost($id: ID!) {
    feedPost(id: $id) {
      id
      body
      teacher { name }
      classroom { id name }
      mediaUrls
      likesCount
      commentsCount
      likedByMe
      comments {
        id
        body
        commenterName
        commenterType
        isMine
        createdAt
      }
      createdAt
    }
  }
`;

export const CREATE_FEED_POST_MUTATION = `
  mutation CreateFeedPost($classroomId: ID!, $body: String!, $signedBlobIds: [String!]) {
    createFeedPost(classroomId: $classroomId, body: $body, signedBlobIds: $signedBlobIds) {
      feedPost { id }
      errors { message path }
    }
  }
`;

export const LIKE_FEED_POST_MUTATION = `
  mutation LikeFeedPost($id: ID!) {
    likeFeedPost(id: $id) {
      feedPost { id likesCount likedByMe }
    }
  }
`;

export const COMMENT_ON_FEED_POST_MUTATION = `
  mutation CommentOnFeedPost($id: ID!, $body: String!) {
    commentOnFeedPost(id: $id, body: $body) {
      comment { id body commenterName createdAt }
      errors { message path }
    }
  }
`;

export const DELETE_FEED_POST_MUTATION = `
  mutation DeleteFeedPost($id: ID!) {
    deleteFeedPost(id: $id) { success }
  }
`;

export const DELETE_FEED_COMMENT_MUTATION = `
  mutation DeleteFeedComment($id: ID!) {
    deleteFeedComment(id: $id) { success }
  }
`;
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(feed): add frontend GraphQL queries and TypeScript types for feed"
```

---

### Task 10: Frontend — Feed Components

**Files:**
- Create: `front-end/src/lib/components/feed/FeedCard.svelte`
- Create: `front-end/src/lib/components/feed/MediaGallery.svelte`
- Create: `front-end/src/lib/components/feed/CommentSection.svelte`
- Create: `front-end/src/lib/components/feed/index.ts`

**Step 1: Create FeedCard component**

`front-end/src/lib/components/feed/FeedCard.svelte`:

```svelte
<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import MediaGallery from './MediaGallery.svelte';
  import CommentSection from './CommentSection.svelte';
  import type { FeedPost } from '$lib/api/types';
  import { formatDate } from '$lib/utils/helpers';

  interface Props {
    post: FeedPost;
    onLike?: (id: string) => void;
    onComment?: (id: string, body: string) => void;
    onShare?: (id: string) => void;
  }

  let { post, onLike, onComment, onShare }: Props = $props();
  let showComments = $state(false);
</script>

<Card>
  <!-- Header -->
  <div class="flex items-center gap-3 mb-3">
    <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
      {post.teacher.name.charAt(0)}
    </div>
    <div class="flex-1">
      <p class="font-semibold text-text">{post.teacher.name}</p>
      <div class="flex items-center gap-2 text-xs text-text-muted">
        <span>{formatDate(post.createdAt)}</span>
        <Badge>{post.classroom.name}</Badge>
      </div>
    </div>
  </div>

  <!-- Body -->
  <p class="text-text mb-3 whitespace-pre-wrap">{post.body}</p>

  <!-- Media -->
  {#if post.mediaUrls.length > 0}
    <MediaGallery urls={post.mediaUrls} />
  {/if}

  <!-- Actions -->
  <div class="flex items-center gap-4 pt-3 border-t border-slate-100">
    <button
      class="flex items-center gap-1.5 text-sm transition-colors {post.likedByMe ? 'text-rose-500 font-semibold' : 'text-text-muted hover:text-rose-500'}"
      onclick={() => onLike?.(post.id)}
    >
      <span>{post.likedByMe ? '❤️' : '🤍'}</span>
      <span>{post.likesCount}</span>
    </button>

    <button
      class="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      onclick={() => showComments = !showComments}
    >
      <span>💬</span>
      <span>{post.commentsCount}</span>
    </button>

    <button
      class="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      onclick={() => onShare?.(post.id)}
    >
      <span>🔗</span>
      <span>Share</span>
    </button>
  </div>

  <!-- Comments -->
  {#if showComments}
    <CommentSection
      postId={post.id}
      comments={post.comments ?? []}
      {onComment}
    />
  {/if}
</Card>
```

**Step 2: Create MediaGallery component**

`front-end/src/lib/components/feed/MediaGallery.svelte`:

```svelte
<script lang="ts">
  interface Props {
    urls: string[];
  }

  let { urls }: Props = $props();

  function isVideo(url: string): boolean {
    return /\.(mp4|webm|mov)(\?|$)/i.test(url);
  }
</script>

<div class="mb-3 rounded-lg overflow-hidden">
  {#if urls.length === 1}
    {#if isVideo(urls[0])}
      <video src={urls[0]} controls class="w-full max-h-96 object-cover rounded-lg">
        <track kind="captions" />
      </video>
    {:else}
      <img src={urls[0]} alt="Post media" class="w-full max-h-96 object-cover rounded-lg" />
    {/if}
  {:else}
    <div class="grid grid-cols-2 gap-1">
      {#each urls.slice(0, 4) as url, i}
        {#if isVideo(url)}
          <video src={url} controls class="w-full h-48 object-cover rounded {i === 0 ? 'rounded-tl-lg' : ''} {i === 1 ? 'rounded-tr-lg' : ''} {i === 2 ? 'rounded-bl-lg' : ''} {i === 3 ? 'rounded-br-lg' : ''}">
            <track kind="captions" />
          </video>
        {:else}
          <img src={url} alt="Post media {i + 1}" class="w-full h-48 object-cover rounded {i === 0 ? 'rounded-tl-lg' : ''} {i === 1 ? 'rounded-tr-lg' : ''} {i === 2 ? 'rounded-bl-lg' : ''} {i === 3 ? 'rounded-br-lg' : ''}" />
        {/if}
      {/each}
    </div>
    {#if urls.length > 4}
      <p class="text-xs text-text-muted mt-1">+{urls.length - 4} more</p>
    {/if}
  {/if}
</div>
```

**Step 3: Create CommentSection component**

`front-end/src/lib/components/feed/CommentSection.svelte`:

```svelte
<script lang="ts">
  import type { FeedPostComment } from '$lib/api/types';
  import { formatDate } from '$lib/utils/helpers';

  interface Props {
    postId: string;
    comments: FeedPostComment[];
    onComment?: (id: string, body: string) => void;
  }

  let { postId, comments, onComment }: Props = $props();
  let newComment = $state('');

  function handleSubmit() {
    if (newComment.trim() && onComment) {
      onComment(postId, newComment.trim());
      newComment = '';
    }
  }
</script>

<div class="mt-3 pt-3 border-t border-slate-100 space-y-3">
  {#each comments as comment}
    <div class="flex gap-2">
      <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
        {comment.commenterName.charAt(0)}
      </div>
      <div class="flex-1 bg-slate-50 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-text">{comment.commenterName}</span>
          <span class="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
        </div>
        <p class="text-sm text-text mt-0.5">{comment.body}</p>
      </div>
    </div>
  {/each}

  <!-- New comment input -->
  <form class="flex gap-2" onsubmit|preventDefault={handleSubmit}>
    <input
      type="text"
      bind:value={newComment}
      placeholder="Write a comment..."
      class="flex-1 text-sm border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
    <button
      type="submit"
      disabled={!newComment.trim()}
      class="text-sm font-semibold text-primary disabled:text-slate-300 px-3"
    >
      Post
    </button>
  </form>
</div>
```

**Step 4: Create index.ts**

`front-end/src/lib/components/feed/index.ts`:

```typescript
export { default as FeedCard } from './FeedCard.svelte';
export { default as MediaGallery } from './MediaGallery.svelte';
export { default as CommentSection } from './CommentSection.svelte';
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(feed): add FeedCard, MediaGallery, CommentSection frontend components"
```

---

### Task 11: Frontend — Parent Dashboard Feed Integration

**Files:**
- Modify: `front-end/src/routes/parent/dashboard/+page.server.ts`
- Modify: `front-end/src/routes/parent/dashboard/+page.svelte`

**Step 1: Update page.server.ts to load feed**

Replace `front-end/src/routes/parent/dashboard/+page.server.ts`:

```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { MY_CHILDREN_QUERY } from '$lib/api/queries/parents';
import { STUDENT_RADAR_QUERY } from '$lib/api/queries/students';
import { FEED_POSTS_QUERY } from '$lib/api/queries/feed';
import type { Student, RadarData, RadarSkills, FeedPost, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const childrenData = await graphql<{ myChildren: Student[] }>(
    MY_CHILDREN_QUERY,
    {},
    locals.accessToken!
  );

  // Load radar data for each child
  const childrenWithRadar = await Promise.all(
    childrenData.myChildren.map(async (child) => {
      try {
        const radarData = await graphql<{ studentRadar: RadarData }>(
          STUDENT_RADAR_QUERY,
          { studentId: child.id },
          locals.accessToken!
        );
        return { ...child, radar: radarData.studentRadar.skills };
      } catch {
        return { ...child, radar: null as RadarSkills | null };
      }
    })
  );

  // Load feed posts
  let feedPosts: FeedPost[] = [];
  try {
    const feedData = await graphql<{ feedPosts: Connection<FeedPost> }>(
      FEED_POSTS_QUERY,
      { first: 20 },
      locals.accessToken!
    );
    feedPosts = feedData.feedPosts.nodes;
  } catch {
    // Feed is non-critical, don't fail the page
  }

  return { children: childrenWithRadar, feedPosts };
};
```

**Step 2: Update page.svelte with feed**

Replace `front-end/src/routes/parent/dashboard/+page.svelte`:

```svelte
<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';
  import { FeedCard } from '$lib/components/feed';

  let { data } = $props();

  // Child filter for feed
  let selectedChildId = $state<string | null>(null);

  // Get unique classroom IDs for selected child
  const filteredPosts = $derived(
    selectedChildId
      ? data.feedPosts.filter((p) => {
          const child = data.children.find((c) => c.id === selectedChildId);
          // For now, show all posts (classroom filter would need classroom IDs on children)
          return child != null;
        })
      : data.feedPosts
  );

  function handleLike(postId: string) {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation($id: ID!) { likeFeedPost(id: $id) { feedPost { id likesCount likedByMe } } }',
        variables: { id: postId }
      })
    }).then(r => r.json()).then(result => {
      const updated = result.data?.likeFeedPost?.feedPost;
      if (updated) {
        const idx = data.feedPosts.findIndex(p => p.id === postId);
        if (idx >= 0) {
          data.feedPosts[idx] = { ...data.feedPosts[idx], ...updated };
          data.feedPosts = [...data.feedPosts]; // trigger reactivity
        }
      }
    });
  }

  function handleComment(postId: string, body: string) {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation($id: ID!, $body: String!) { commentOnFeedPost(id: $id, body: $body) { comment { id body commenterName commenterType createdAt } } }',
        variables: { id: postId, body }
      })
    }).then(r => r.json()).then(result => {
      const comment = result.data?.commentOnFeedPost?.comment;
      if (comment) {
        const idx = data.feedPosts.findIndex(p => p.id === postId);
        if (idx >= 0) {
          const post = data.feedPosts[idx];
          post.comments = [...(post.comments ?? []), comment];
          post.commentsCount = (post.commentsCount ?? 0) + 1;
          data.feedPosts = [...data.feedPosts];
        }
      }
    });
  }

  function handleShare(postId: string) {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  }
</script>

<svelte:head>
  <title>My Children — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">My Children</h1>

  {#if data.children.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No children linked yet</p>
      <p class="text-sm mt-1">Ask your child's teacher to link your account.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {#each data.children as child}
        <a href="/parent/children/{child.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text mb-3">{child.name}</h3>
            {#if child.radar}
              <RadarChart skills={child.radar} label={child.name} size="sm" />
            {:else}
              <p class="text-sm text-text-muted text-center py-8">No data yet</p>
            {/if}
          </Card>
        </a>
      {/each}
    </div>

    <!-- Feed Section -->
    <div class="mt-8">
      <h2 class="text-xl font-bold text-text mb-4">Class Feed</h2>

      <!-- Child filter tabs -->
      <div class="flex gap-2 mb-4 overflow-x-auto">
        <button
          class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {selectedChildId === null ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'}"
          onclick={() => selectedChildId = null}
        >
          All
        </button>
        {#each data.children as child}
          <button
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {selectedChildId === child.id ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'}"
            onclick={() => selectedChildId = child.id}
          >
            {child.name}
          </button>
        {/each}
      </div>

      <!-- Feed posts -->
      {#if filteredPosts.length === 0}
        <div class="text-center py-12 text-text-muted">
          <p class="text-lg">No posts yet</p>
          <p class="text-sm mt-1">Your child's teacher will post updates here.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each filteredPosts as post (post.id)}
            <FeedCard
              {post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(feed): integrate feed into parent dashboard with like/comment/share"
```

---

### Task 12: Frontend — Teacher Create Post Page

**Files:**
- Create: `front-end/src/routes/teacher/feed/+page.server.ts`
- Create: `front-end/src/routes/teacher/feed/+page.svelte`

**Step 1: Create page.server.ts**

`front-end/src/routes/teacher/feed/+page.server.ts`:

```typescript
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { FEED_POSTS_QUERY, CREATE_FEED_POST_MUTATION } from '$lib/api/queries/feed';
import type { Classroom, FeedPost, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const [classroomsData, feedData] = await Promise.all([
    graphql<{ classrooms: Classroom[] }>(CLASSROOMS_QUERY, {}, locals.accessToken!),
    graphql<{ feedPosts: Connection<FeedPost> }>(FEED_POSTS_QUERY, { first: 20 }, locals.accessToken!)
  ]);

  return {
    classrooms: classroomsData.classrooms,
    feedPosts: feedData.feedPosts.nodes
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const classroomId = formData.get('classroomId') as string;
    const body = formData.get('body') as string;

    if (!classroomId || !body?.trim()) {
      return fail(400, { error: 'Classroom and message are required' });
    }

    try {
      const result = await graphql<{ createFeedPost: { feedPost: { id: string } | null; errors: { message: string }[] } }>(
        CREATE_FEED_POST_MUTATION,
        { classroomId, body: body.trim() },
        locals.accessToken!
      );

      if (result.createFeedPost.errors.length > 0) {
        return fail(400, { error: result.createFeedPost.errors[0].message });
      }
    } catch {
      return fail(500, { error: 'Failed to create post' });
    }

    throw redirect(303, '/teacher/feed');
  }
};
```

**Step 2: Create page.svelte**

`front-end/src/routes/teacher/feed/+page.svelte`:

```svelte
<script lang="ts">
  import { Card, Button, Alert } from '$lib/components/ui';
  import { FeedCard } from '$lib/components/feed';
  import { formatDate } from '$lib/utils/helpers';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>Class Feed — GrewMe</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold text-text mb-6">Class Feed</h1>

  <!-- Create Post Form -->
  <Card class="mb-8">
    <h2 class="text-lg font-semibold text-text mb-4">Create Post</h2>

    {#if form?.error}
      <Alert variant="error" class="mb-4">{form.error}</Alert>
    {/if}

    <form method="POST" class="space-y-4">
      <div>
        <label for="classroomId" class="block text-sm font-medium text-text mb-1">Classroom</label>
        <select
          name="classroomId"
          id="classroomId"
          required
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select classroom...</option>
          {#each data.classrooms as classroom}
            <option value={classroom.id}>{classroom.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="body" class="block text-sm font-medium text-text mb-1">Message</label>
        <textarea
          name="body"
          id="body"
          required
          rows="4"
          placeholder="Share an update with parents..."
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        ></textarea>
      </div>

      <!-- TODO: Media upload zone (Task 13) -->

      <Button type="submit">Post Update</Button>
    </form>
  </Card>

  <!-- Recent Posts -->
  <h2 class="text-lg font-semibold text-text mb-4">Recent Posts</h2>

  {#if data.feedPosts.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p>No posts yet. Create your first update above!</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.feedPosts as post (post.id)}
        <FeedCard {post} />
      {/each}
    </div>
  {/if}
</div>
```

**Step 3: Add feed link to teacher sidebar**

Check the Sidebar component and add a "Feed" link. Find the sidebar file:

In `front-end/src/lib/components/layout/Sidebar.svelte`, add a feed link in the teacher navigation section:

```svelte
<!-- Add alongside existing teacher nav links -->
<a href="/teacher/feed">📢 Class Feed</a>
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(feed): add teacher create post page and sidebar link"
```

---

### Task 13: Frontend — Public Post Page (Shareable URL)

**Files:**
- Create: `front-end/src/routes/posts/[id]/+page.server.ts`
- Create: `front-end/src/routes/posts/[id]/+page.svelte`

**Step 1: Create page.server.ts**

`front-end/src/routes/posts/[id]/+page.server.ts`:

```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { FEED_POST_QUERY } from '$lib/api/queries/feed';
import type { FeedPost } from '$lib/api/types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    // feedPost query allows unauthenticated access for public posts
    const data = await graphql<{ feedPost: FeedPost }>(
      FEED_POST_QUERY,
      { id: params.id },
      locals.accessToken ?? undefined
    );
    return { post: data.feedPost };
  } catch {
    throw error(404, 'Post not found');
  }
};
```

**Step 2: Create page.svelte**

`front-end/src/routes/posts/[id]/+page.svelte`:

```svelte
<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import { MediaGallery } from '$lib/components/feed';
  import { formatDate } from '$lib/utils/helpers';

  let { data } = $props();
  const post = data.post;
</script>

<svelte:head>
  <title>{post.teacher.name} — GrewMe</title>
  <meta property="og:title" content="{post.teacher.name} posted on GrewMe" />
  <meta property="og:description" content="{post.body.slice(0, 200)}" />
  <meta property="og:type" content="article" />
</svelte:head>

<div class="max-w-2xl mx-auto py-8 px-4">
  <div class="mb-4">
    <a href="/" class="text-sm text-primary hover:underline">← Back to GrewMe</a>
  </div>

  <Card>
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
        {post.teacher.name.charAt(0)}
      </div>
      <div>
        <p class="font-semibold text-text text-lg">{post.teacher.name}</p>
        <div class="flex items-center gap-2 text-sm text-text-muted">
          <span>{formatDate(post.createdAt)}</span>
          <Badge>{post.classroom.name}</Badge>
        </div>
      </div>
    </div>

    <p class="text-text text-lg mb-4 whitespace-pre-wrap">{post.body}</p>

    {#if post.mediaUrls.length > 0}
      <MediaGallery urls={post.mediaUrls} />
    {/if}

    <div class="flex items-center gap-4 pt-3 border-t border-slate-100 text-sm text-text-muted">
      <span>❤️ {post.likesCount} likes</span>
      <span>💬 {post.commentsCount} comments</span>
    </div>

    {#if post.comments.length > 0}
      <div class="mt-4 pt-3 border-t border-slate-100 space-y-3">
        {#each post.comments as comment}
          <div class="flex gap-2">
            <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
              {comment.commenterName.charAt(0)}
            </div>
            <div class="bg-slate-50 rounded-lg px-3 py-2 flex-1">
              <span class="text-sm font-semibold text-text">{comment.commenterName}</span>
              <span class="text-xs text-text-muted ml-2">{formatDate(comment.createdAt)}</span>
              <p class="text-sm text-text mt-0.5">{comment.body}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</div>
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(feed): add public shareable post page with OG meta tags"
```

---

### Task 14: Verify & Final Test

**Step 1: Run backend tests**

```bash
cd backend && bin/rails test
```

Expected: ALL PASS

**Step 2: Run frontend check**

```bash
cd front-end && npx svelte-check --threshold error
```

Expected: 0 errors

**Step 3: Run frontend build**

```bash
cd front-end && npx vite build
```

Expected: Build succeeds

**Step 4: Manual browser test**

1. Login as teacher (alice@greenwood.edu / password123)
2. Go to /teacher/feed → create a post for Class 1A
3. Login as parent (carol@parent.com / password123)
4. See the post on /parent/dashboard
5. Like the post, add a comment
6. Click share → verify URL copied
7. Open shared URL in incognito → verify public page renders

**Step 5: Final commit**

```bash
git add -A && git commit -m "feat(feed): parent feed feature complete"
```
