class Student < ApplicationRecord
  belongs_to :classroom

  has_many :parent_students, dependent: :destroy
  has_many :parents, through: :parent_students, source: :parent
  has_many :daily_scores, dependent: :destroy

  validates :name, presence: true

  def radar_data(start_date: nil, end_date: nil)
    scope = daily_scores
    scope = scope.where("date >= ?", start_date) if start_date
    scope = scope.where("date <= ?", end_date) if end_date
    scope.group(:skill_category).average(:score)
  end
end
