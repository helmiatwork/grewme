class School < ApplicationRecord
  include PublicActivity::Model

  tracked

  has_many :classrooms, dependent: :destroy
  has_many :subjects, dependent: :destroy
  has_many :teachers, dependent: :nullify
  has_many :school_managers, dependent: :destroy
  has_many :academic_years, dependent: :destroy
  has_many :invitations, dependent: :destroy

  validates :name, presence: true
  validates :min_grade, :max_grade, presence: true,
    numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 12 }
  validate :max_grade_gte_min_grade

  def grade_range
    min_grade..max_grade
  end

  def grade_display_name(grade)
    case grade
    when 1..6 then "ELM #{grade}"
    when 7..9 then "JHS #{grade - 6}"
    when 10..12 then "SHS #{grade - 9}"
    end
  end
  validates :country_code, inclusion: { in: ->(_) { ISO3166::Country.codes }, message: "is not a valid ISO 3166-1 alpha-2 code" },
    allow_blank: true

  def full_address
    [ address_line1, address_line2, city, state_province, postal_code, country_name ].compact_blank.join(", ")
  end

  def country_name
    return nil if country_code.blank?
    ISO3166::Country.new(country_code)&.common_name || ISO3166::Country.new(country_code)&.name
  end

  private

  def max_grade_gte_min_grade
    errors.add(:max_grade, "must be >= min_grade") if max_grade && min_grade && max_grade < min_grade
  end
end
