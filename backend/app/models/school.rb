class School < ApplicationRecord
  include PublicActivity::Model

  tracked

  has_many :classrooms, dependent: :destroy
  has_many :teachers, dependent: :nullify
  has_many :school_managers, dependent: :destroy

  validates :name, presence: true
  validates :country_code, inclusion: { in: ->(_) { ISO3166::Country.codes }, message: "is not a valid ISO 3166-1 alpha-2 code" },
    allow_blank: true

  def full_address
    [ address_line1, address_line2, city, state_province, postal_code, country_name ].compact_blank.join(", ")
  end

  def country_name
    return nil if country_code.blank?
    ISO3166::Country.new(country_code)&.common_name || ISO3166::Country.new(country_code)&.name
  end
end
