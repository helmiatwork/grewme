// === Curriculum Queries ===

export const SUBJECTS_QUERY = `
  query Subjects($schoolId: ID!) {
    subjects(schoolId: $schoolId) {
      id
      name
      description
      topics {
        id
        name
        position
        learningObjectives { id }
        exams { id }
      }
      createdAt
    }
  }
`;

export const SUBJECT_QUERY = `
  query Subject($id: ID!) {
    subject(id: $id) {
      id
      name
      description
      topics {
        id
        name
        description
        position
        learningObjectives {
          id
          description
          position
          masteryThreshold
        }
        exams {
          id
          title
          examType
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const TOPIC_QUERY = `
  query Topic($id: ID!) {
    topic(id: $id) {
      id
      name
      description
      position
      subject { id name }
      learningObjectives {
        id
        description
        position
        masteryThreshold
        createdAt
      }
      exams {
        id
        title
        description
        examType
        maxScore
        durationMinutes
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// === Exam Queries ===

export const EXAM_QUERY = `
  query Exam($id: ID!) {
    exam(id: $id) {
      id
      title
      description
      examType
      maxScore
      durationMinutes
      topic {
        id
        name
        subject { id name }
      }
      examQuestions {
        id
        questionText
        questionType
        options
        correctAnswer
        points
        position
      }
      rubricCriteria {
        id
        name
        description
        maxScore
        position
      }
      classroomExams {
        id
        classroom { id name }
        status
        scheduledAt
        dueAt
        examSubmissions {
          id
          student { id name }
          status
          score
          passed
          submittedAt
          gradedAt
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const CLASSROOM_EXAMS_QUERY = `
  query ClassroomExams($classroomId: ID!, $status: ClassroomExamStatus) {
    classroomExams(classroomId: $classroomId, status: $status) {
      id
      exam {
        id
        title
        examType
        maxScore
        durationMinutes
        topic { id name subject { id name } }
      }
      classroom { id name }
      status
      scheduledAt
      dueAt
      examSubmissions {
        id
        student { id name }
        status
        score
        passed
      }
      createdAt
    }
  }
`;

export const EXAM_SUBMISSION_QUERY = `
  query ExamSubmission($id: ID!) {
    examSubmission(id: $id) {
      id
      student { id name }
      classroomExam {
        id
        exam {
          id
          title
          examType
          maxScore
          topic { id name subject { id name } }
          examQuestions {
            id
            questionText
            questionType
            options
            correctAnswer
            points
            position
          }
          rubricCriteria {
            id
            name
            description
            maxScore
            position
          }
        }
        classroom { id name }
      }
      status
      score
      passed
      startedAt
      submittedAt
      gradedAt
      teacherNotes
      examAnswers {
        id
        examQuestion { id questionText points }
        answerText
        selectedOption
        score
        correct
      }
      rubricScores {
        id
        rubricCriteria { id name maxScore }
        score
        comment
      }
      createdAt
    }
  }
`;

export const STUDENT_MASTERIES_QUERY = `
  query StudentMasteries($studentId: ID!, $subjectId: ID) {
    studentMasteries(studentId: $studentId, subjectId: $subjectId) {
      id
      student { id name }
      learningObjective {
        id
        description
        topic { id name subject { id name } }
      }
      examMastered
      dailyMastered
      mastered
      masteredAt
    }
  }
`;

// === Curriculum Mutations ===

export const CREATE_SUBJECT_MUTATION = `
  mutation CreateSubject($input: CreateSubjectInput!) {
    createSubject(input: $input) {
      subject {
        id
        name
        description
      }
      errors
    }
  }
`;

export const UPDATE_SUBJECT_MUTATION = `
  mutation UpdateSubject($input: UpdateSubjectInput!) {
    updateSubject(input: $input) {
      subject {
        id
        name
        description
      }
      errors
    }
  }
`;

export const DELETE_SUBJECT_MUTATION = `
  mutation DeleteSubject($id: ID!) {
    deleteSubject(id: $id) {
      success
      errors
    }
  }
`;

export const CREATE_TOPIC_MUTATION = `
  mutation CreateTopic($input: CreateTopicInput!) {
    createTopic(input: $input) {
      topic {
        id
        name
        description
        position
      }
      errors
    }
  }
`;

export const UPDATE_TOPIC_MUTATION = `
  mutation UpdateTopic($input: UpdateTopicInput!) {
    updateTopic(input: $input) {
      topic {
        id
        name
        description
        position
      }
      errors
    }
  }
`;

export const DELETE_TOPIC_MUTATION = `
  mutation DeleteTopic($id: ID!) {
    deleteTopic(id: $id) {
      success
      errors
    }
  }
`;

export const CREATE_LEARNING_OBJECTIVE_MUTATION = `
  mutation CreateLearningObjective($input: CreateLearningObjectiveInput!) {
    createLearningObjective(input: $input) {
      learningObjective {
        id
        description
        position
        masteryThreshold
      }
      errors
    }
  }
`;

export const UPDATE_LEARNING_OBJECTIVE_MUTATION = `
  mutation UpdateLearningObjective($input: UpdateLearningObjectiveInput!) {
    updateLearningObjective(input: $input) {
      learningObjective {
        id
        description
        position
        masteryThreshold
      }
      errors
    }
  }
`;

export const DELETE_LEARNING_OBJECTIVE_MUTATION = `
  mutation DeleteLearningObjective($id: ID!) {
    deleteLearningObjective(id: $id) {
      success
      errors
    }
  }
`;

// === Exam Mutations ===

export const CREATE_EXAM_MUTATION = `
  mutation CreateExam($input: CreateExamInput!) {
    createExam(input: $input) {
      exam {
        id
        title
        examType
        maxScore
      }
      errors
    }
  }
`;

export const ASSIGN_EXAM_MUTATION = `
  mutation AssignExamToClassroom($input: AssignExamInput!) {
    assignExamToClassroom(input: $input) {
      classroomExam {
        id
        status
        scheduledAt
        dueAt
      }
      errors
    }
  }
`;

export const SUBMIT_EXAM_ANSWERS_MUTATION = `
  mutation SubmitExamAnswers($input: SubmitAnswersInput!) {
    submitExamAnswers(input: $input) {
      examSubmission {
        id
        status
        score
        passed
      }
      errors
    }
  }
`;

export const GRADE_EXAM_SUBMISSION_MUTATION = `
  mutation GradeExamSubmission($input: GradeSubmissionInput!) {
    gradeExamSubmission(input: $input) {
      examSubmission {
        id
        status
        score
        passed
        gradedAt
        teacherNotes
      }
      errors
    }
  }
`;
