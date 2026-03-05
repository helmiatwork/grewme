require "test_helper"

class SchoolManagerTest < ActiveSupport::TestCase
  # === schoolOverview query ===

  test "school manager sees school overview" do
    result = execute_query(
      query: "{ schoolOverview { schoolName classroomCount studentCount teacherCount } }",
      user: school_managers(:manager_pat)
    )

    overview = result.dig("data", "schoolOverview")
    assert_not_nil overview
    assert_equal "Greenwood Elementary", overview["schoolName"]
    assert overview["classroomCount"] > 0
    assert overview["teacherCount"] > 0
  end

  test "teacher cannot access school overview" do
    result = execute_query(
      query: "{ schoolOverview { schoolName } }",
      user: teachers(:teacher_alice)
    )

    assert result["errors"].any? { |e| e["message"].include?("school manager") }
  end

  # === classrooms query (school-wide) ===

  test "school manager sees all school classrooms" do
    result = execute_query(
      query: "{ classrooms { id name } }",
      user: school_managers(:manager_pat)
    )

    classrooms = result.dig("data", "classrooms")
    assert_not_nil classrooms
    names = classrooms.map { |c| c["name"] }
    assert_includes names, "Class 1A"
    assert_includes names, "Class 2B"
  end

  # === schoolTeachers query ===

  test "school manager sees all teachers" do
    result = execute_query(
      query: "{ schoolTeachers { id name email } }",
      user: school_managers(:manager_pat)
    )

    teachers = result.dig("data", "schoolTeachers")
    assert_not_nil teachers
    names = teachers.map { |t| t["name"] }
    assert_includes names, "Alice Teacher"
    assert_includes names, "Bob Teacher"
  end

  # === assignTeacherToClassroom mutation ===

  test "school manager assigns teacher to classroom" do
    result = execute_query(
      mutation: 'mutation($teacherId: ID!, $classroomId: ID!, $role: String!) {
        assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
          classroomTeacher { id role teacher { name } classroom { name } }
          errors { message }
        }
      }',
      variables: {
        teacherId: teachers(:teacher_bob).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s,
        role: "assistant"
      },
      user: school_managers(:manager_pat)
    )

    ct = result.dig("data", "assignTeacherToClassroom", "classroomTeacher")
    errors = result.dig("data", "assignTeacherToClassroom", "errors")
    assert_empty errors
    assert_equal "assistant", ct["role"]
  end

  # === removeTeacherFromClassroom mutation ===

  test "school manager removes teacher from classroom" do
    result = execute_query(
      mutation: 'mutation($teacherId: ID!, $classroomId: ID!) {
        removeTeacherFromClassroom(teacherId: $teacherId, classroomId: $classroomId) {
          success
          errors { message }
        }
      }',
      variables: {
        teacherId: teachers(:teacher_alice).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s
      },
      user: school_managers(:manager_pat)
    )

    assert_equal true, result.dig("data", "removeTeacherFromClassroom", "success")
  end

  # === transferStudent mutation ===

  test "school manager transfers student between classrooms" do
    result = execute_query(
      mutation: 'mutation($studentId: ID!, $fromClassroomId: ID!, $toClassroomId: ID!) {
        transferStudent(studentId: $studentId, fromClassroomId: $fromClassroomId, toClassroomId: $toClassroomId) {
          success
          errors { message }
        }
      }',
      variables: {
        studentId: students(:student_emma).id.to_s,
        fromClassroomId: classrooms(:alice_class).id.to_s,
        toClassroomId: classrooms(:bob_class).id.to_s
      },
      user: school_managers(:manager_pat)
    )

    assert_equal true, result.dig("data", "transferStudent", "success")

    # Verify old enrollment is transferred
    old = ClassroomStudent.find_by(student: students(:student_emma), classroom: classrooms(:alice_class))
    assert_equal "transferred", old.status

    # Verify new enrollment is active
    new_enrollment = ClassroomStudent.find_by(student: students(:student_emma), classroom: classrooms(:bob_class), status: :active)
    assert_not_nil new_enrollment
  end

  # === Authorization ===

  test "teacher cannot assign teachers" do
    result = execute_query(
      mutation: 'mutation($teacherId: ID!, $classroomId: ID!, $role: String!) {
        assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
          classroomTeacher { id }
          errors { message }
        }
      }',
      variables: {
        teacherId: teachers(:teacher_bob).id.to_s,
        classroomId: classrooms(:alice_class).id.to_s,
        role: "assistant"
      },
      user: teachers(:teacher_alice)
    )

    assert result["errors"].any? { |e| e["message"].include?("school manager") }
  end
end
