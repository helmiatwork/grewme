export const CLASSROOM_EVENTS_QUERY = `
  query ClassroomEvents($month: ISO8601Date!, $classroomIds: [ID!]) {
    classroomEvents(month: $month, classroomIds: $classroomIds) {
      id
      title
      description
      eventDate
      startTime
      endTime
      classroom { id name }
      creatorName
      creatorType
      isMine
      createdAt
    }
  }
`;

export const CREATE_CLASSROOM_EVENT_MUTATION = `
  mutation CreateClassroomEvent(
    $classroomId: ID!, $title: String!, $eventDate: ISO8601Date!,
    $description: String, $startTime: String, $endTime: String
  ) {
    createClassroomEvent(
      classroomId: $classroomId, title: $title, eventDate: $eventDate,
      description: $description, startTime: $startTime, endTime: $endTime
    ) {
      classroomEvent {
        id title description eventDate startTime endTime
        classroom { id name }
        creatorName creatorType isMine createdAt
      }
      errors { message path }
    }
  }
`;

export const DELETE_CLASSROOM_EVENT_MUTATION = `
  mutation DeleteClassroomEvent($id: ID!) {
    deleteClassroomEvent(id: $id) {
      success
      errors { message path }
    }
  }
`;
