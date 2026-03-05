class FeedPostStudent < ApplicationRecord
  belongs_to :feed_post
  belongs_to :student

  validates :student_id, uniqueness: { scope: :feed_post_id }
end
