class FeedPostComment < ApplicationRecord
  belongs_to :feed_post, counter_cache: :comments_count
  belongs_to :commenter, polymorphic: true

  validates :body, presence: true
end
