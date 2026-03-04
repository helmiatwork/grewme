class TeacherResource
  include Alba::Resource

  root_key :user
  attributes :id, :name, :email

  attribute :role do |_teacher|
    "teacher"
  end
end
