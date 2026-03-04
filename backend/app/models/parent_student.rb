class ParentStudent < ApplicationRecord
  belongs_to :parent, class_name: "User"
  belongs_to :student

  validates :parent_id, uniqueness: { scope: :student_id }
end
