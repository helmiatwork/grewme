class ClassroomResource
  include Alba::Resource

  root_key :classroom, :classrooms
  attributes :id, :name

  attribute :student_count do |classroom|
    classroom.students.size
  end
end
