class StudentResource
  include Alba::Resource

  root_key :student, :students
  attributes :id, :name, :avatar
end
