# Design: Parent Feed (Teacher Posts)

## Summary

Teachers create Facebook-style posts (text + images + videos) scoped to a classroom. All parents with children in that classroom see the posts in a chronological feed on their dashboard. Parents can filter by child, like, comment, and share a public URL for individual posts.

## Data Model

### feed_posts

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| teacher_id | FK → teachers | Author |
| classroom_id | FK → classrooms | Audience scope |
| body | text | Required, post content |
| likes_count | integer | Counter cache, default 0 |
| comments_count | integer | Counter cache, default 0 |
| created_at | datetime | |
| updated_at | datetime | |

Media attachments via Rails Active Storage: `has_many_attached :media` (images + videos).

### feed_post_likes

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| feed_post_id | FK → feed_posts | |
| liker_type | string | Polymorphic (Parent/Teacher) |
| liker_id | bigint | |
| created_at | datetime | |

Unique index on `[feed_post_id, liker_type, liker_id]`.

### feed_post_comments

| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| feed_post_id | FK → feed_posts | |
| commenter_type | string | Polymorphic (Parent/Teacher) |
| commenter_id | bigint | |
| body | text | Required |
| created_at | datetime | |
| updated_at | datetime | |

## File Storage

- **Local dev**: Active Storage → Minio (S3-compatible, Docker)
- **Production**: Active Storage → AWS S3
- **Config**: `config/storage.yml` with `:amazon` service, env vars for endpoint/bucket/credentials
- **Accepted types**: images (jpg, png, webp, gif), videos (mp4, webm)
- **Max file size**: 10MB images, 100MB videos

## Visibility Rules

- Parent sees all posts from classrooms where their child is enrolled
- Filter by child: filters to that child's classroom(s)
- Teacher sees posts they created (future scope)
- Public post page: read-only, no auth required (shareable URL)

## GraphQL API

### Queries

- `feedPosts(classroomIds: [ID!], first: Int, after: String)` — paginated feed for parent's classrooms. Returns posts with author, media URLs, like count, comment count, whether current user liked it.
- `feedPost(id: ID!)` — single post with full comments list.

### Mutations

- `createFeedPost(classroomId: ID!, body: String!, signedBlobIds: [String!])` — teacher creates post with pre-uploaded media.
- `deleteFeedPost(id: ID!)` — teacher deletes own post.
- `likeFeedPost(id: ID!)` — toggle like (like/unlike).
- `commentOnFeedPost(id: ID!, body: String!)` — add comment.
- `deleteComment(id: ID!)` — delete own comment.

### File Upload Flow

Two-step upload (avoids GraphQL multipart complexity):
1. Frontend uploads files to `POST /api/upload` (SvelteKit BFF route) → proxies to Rails `POST /direct_uploads` (Active Storage direct upload) → returns signed blob IDs.
2. `createFeedPost` mutation receives `signedBlobIds` and attaches them.

## Frontend Pages

### Parent Dashboard (`/parent/dashboard`)

- Children cards with radar charts (existing)
- **Feed section below**: chronological posts from all children's classrooms
- Child filter tabs at top of feed
- Each post card: teacher name, timestamp, body text, media gallery (image grid / video player), like button + count, comment toggle + count, share button (copies URL)
- Infinite scroll pagination (cursor-based)

### Teacher Create Post (`/teacher/feed`)

- Select classroom dropdown
- Text area for post body
- Media upload zone (drag & drop or click)
- Preview before posting
- List of own recent posts

### Public Post (`/posts/:id`)

- Read-only rendered post with media
- No auth required
- OG meta tags for link previews when shared on social media

## Models

```ruby
class FeedPost < ApplicationRecord
  belongs_to :teacher
  belongs_to :classroom
  has_many_attached :media
  has_many :likes, class_name: "FeedPostLike", dependent: :destroy
  has_many :comments, class_name: "FeedPostComment", dependent: :destroy

  validates :body, presence: true
end

class FeedPostLike < ApplicationRecord
  belongs_to :feed_post, counter_cache: :likes_count
  belongs_to :liker, polymorphic: true

  validates :liker_id, uniqueness: { scope: [:feed_post_id, :liker_type] }
end

class FeedPostComment < ApplicationRecord
  belongs_to :feed_post, counter_cache: :comments_count
  belongs_to :commenter, polymorphic: true

  validates :body, presence: true
end
```

## Authorization (Pundit)

- **Create post**: teacher must be assigned to the classroom
- **Delete post**: only the author
- **Like/comment**: any authenticated parent with a child in the classroom, or the classroom's teacher
- **View feed**: parent must have a child in at least one of the requested classrooms
- **Public post page**: no auth (read-only)
