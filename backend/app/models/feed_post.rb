class FeedPost < ApplicationRecord
  belongs_to :teacher
  belongs_to :classroom
  has_many_attached :media
  has_many :feed_post_students, dependent: :destroy
  has_many :tagged_students, through: :feed_post_students, source: :student
  has_many :likes, class_name: "FeedPostLike", dependent: :destroy
  has_many :comments, class_name: "FeedPostComment", dependent: :destroy

  validates :body, presence: true

  scope :for_classrooms, ->(ids) { where(classroom_id: ids).order(created_at: :desc) }
end
