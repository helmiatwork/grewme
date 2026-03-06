class Subject < ApplicationRecord
  include PublicActivity::Model

  tracked

  belongs_to :school
  has_many :topics, dependent: :destroy

  validates :name, presence: true, uniqueness: { scope: :school_id }

  after_commit :invalidate_subject_cache

  private

  def invalidate_subject_cache
    Rails.cache.delete("subjects/#{school_id}")
  end
end
