class ClassroomEvent < ApplicationRecord
  belongs_to :classroom
  belongs_to :creator, polymorphic: true

  validates :title, presence: true
  validates :event_date, presence: true

  scope :for_month, ->(date) {
    beginning = date.beginning_of_month
    ending = date.end_of_month
    where(event_date: beginning..ending)
  }

  scope :for_classroom_ids, ->(ids) { where(classroom_id: ids) }
end
