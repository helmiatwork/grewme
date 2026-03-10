export const EXAM_BY_ACCESS_CODE_QUERY = `
  query ExamByAccessCode($code: String!) {
    examByAccessCode(code: $code) {
      id
      accessCode
      durationMinutes
      showResults
      exam {
        id
        title
        examType
        examQuestions {
          id
          questionText
          answerOptions
          points
        }
      }
      classroom {
        id
        name
        students { id firstName lastName }
      }
    }
  }
`;

export const EXAM_SESSION_QUERY = `
  query ExamSession($sessionToken: String!) {
    examSession(sessionToken: $sessionToken) {
      id
      status
      startedAt
      timeRemaining
      sessionToken
      examAnswers {
        examQuestion { id }
        selectedAnswer
      }
    }
  }
`;

export const START_EXAM_MUTATION = `
  mutation StartExam($input: StartExamInput!) {
    startExam(input: $input) {
      examSubmission {
        id
        sessionToken
        status
        startedAt
        timeRemaining
      }
      errors { message path }
    }
  }
`;

export const SAVE_EXAM_PROGRESS_MUTATION = `
  mutation SaveExamProgress($input: SaveExamProgressInput!) {
    saveExamProgress(input: $input) {
      success
      errors { message path }
    }
  }
`;

export const SUBMIT_EXAM_SESSION_MUTATION = `
  mutation SubmitExamSession($input: SubmitExamSessionInput!) {
    submitExamSession(input: $input) {
      examSubmission {
        id
        status
        score
        submittedAt
      }
      errors { message path }
    }
  }
`;
