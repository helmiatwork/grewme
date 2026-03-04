class Student < ApplicationRecord
  has_many :classroom_students, dependent: :destroy
  has_many :classrooms, through: :classroom_students
  has_many :parent_students, dependent: :destroy
  has_many :parents, through: :parent_students, source: :parent
  has_many :daily_scores, dependent: :destroy

  validates :name, presence: true

  def current_classroom
    classroom_students.current.includes(:classroom).first&.classroom
  end

  def current_enrollment
    classroom_students.current.first
  end

  def enroll!(classroom, academic_year:, enrolled_at: Date.current)
    # Deactivate any current enrollment
    current_enrollment&.deactivate!

    classroom_students.create!(
      classroom: classroom,
      academic_year: academic_year,
      enrolled_at: enrolled_at,
      status: :active
    )
  end

  def radar_data(start_date: nil, end_date: nil)
    scope = daily_scores
    scope = scope.where("date >= ?", start_date) if start_date
    scope = scope.where("date <= ?", end_date) if end_date
    scope.group(:skill_category).average(:score)
  end
end
