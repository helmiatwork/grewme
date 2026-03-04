class ClassroomResource
  include Alba::Resource

  root_key :classroom, :classrooms
  attributes :id, :name

  attribute :student_count do |classroom|
    classroom.classroom_students.select { |cs| cs.active? }.size
  end
end
