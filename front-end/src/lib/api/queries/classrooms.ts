export const CLASSROOMS_QUERY = `
  query Classrooms {
    classrooms {
      id
      name
      school {
        id
        name
      }
    }
  }
`;

export const CLASSROOM_QUERY = `
  query Classroom($id: ID!) {
    classroom(id: $id) {
      id
      name
      school {
        id
        name
      }
      students {
        id
        name
      }
    }
  }
`;

export const CLASSROOM_OVERVIEW_QUERY = `
  query ClassroomOverview($classroomId: ID!) {
    classroomOverview(classroomId: $classroomId) {
      classroomId
      classroomName
      students {
        studentId
        studentName
        skills {
          reading
          math
          writing
          logic
          social
        }
      }
    }
  }
`;
