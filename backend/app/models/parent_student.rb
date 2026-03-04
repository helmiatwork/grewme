class ParentStudent < ApplicationRecord
  belongs_to :parent
  belongs_to :student

  validates :parent_id, uniqueness: { scope: :student_id }
end
