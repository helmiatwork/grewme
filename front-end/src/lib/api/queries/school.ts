export const SCHOOL_OVERVIEW_QUERY = `
  query SchoolOverview {
    schoolOverview {
      schoolName
      classroomCount
      studentCount
      teacherCount
    }
  }
`;

export const SCHOOL_CLASSROOMS_QUERY = `
  query SchoolClassrooms {
    classrooms {
      id
      name
      studentCount
    }
  }
`;

export const SCHOOL_TEACHERS_QUERY = `
  query SchoolTeachers {
    schoolTeachers {
      id
      name
      email
      classrooms { id name }
    }
  }
`;

export const SCHOOL_STUDENTS_QUERY = `
  query SchoolStudents {
    classrooms {
      id
      name
      students { id name }
    }
  }
`;

export const ASSIGN_TEACHER_MUTATION = `
  mutation AssignTeacher($teacherId: ID!, $classroomId: ID!, $role: String!) {
    assignTeacherToClassroom(teacherId: $teacherId, classroomId: $classroomId, role: $role) {
      classroomTeacher { id role teacher { name } classroom { name } }
      errors { message path }
    }
  }
`;

export const REMOVE_TEACHER_MUTATION = `
  mutation RemoveTeacher($teacherId: ID!, $classroomId: ID!) {
    removeTeacherFromClassroom(teacherId: $teacherId, classroomId: $classroomId) {
      success
      errors { message path }
    }
  }
`;

export const TRANSFER_STUDENT_MUTATION = `
  mutation TransferStudent($studentId: ID!, $fromClassroomId: ID!, $toClassroomId: ID!) {
    transferStudent(studentId: $studentId, fromClassroomId: $fromClassroomId, toClassroomId: $toClassroomId) {
      success
      errors { message path }
    }
  }
`;
