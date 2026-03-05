class FeedPostLike < ApplicationRecord
  belongs_to :feed_post, counter_cache: :likes_count
  belongs_to :liker, polymorphic: true

  validates :liker_id, uniqueness: { scope: [ :feed_post_id, :liker_type ] }
end
