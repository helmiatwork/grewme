export const STUDENT_QUERY = `
  query Student($id: ID!) {
    student(id: $id) {
      id
      name
    }
  }
`;

export const STUDENT_RADAR_QUERY = `
  query StudentRadar($studentId: ID!) {
    studentRadar(studentId: $studentId) {
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
`;

export const STUDENT_PROGRESS_QUERY = `
  query StudentProgress($studentId: ID!) {
    studentProgress(studentId: $studentId) {
      weeks {
        period
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

export const STUDENT_DAILY_SCORES_QUERY = `
  query StudentDailyScores($studentId: ID!, $skillCategory: SkillCategoryEnum, $first: Int, $after: String) {
    studentDailyScores(studentId: $studentId, skillCategory: $skillCategory, first: $first, after: $after) {
      nodes {
        id
        date
        skillCategory
        score
        student {
          id
          name
        }
        teacher {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const CREATE_DAILY_SCORE_MUTATION = `
  mutation CreateDailyScore($input: CreateDailyScoreInput!) {
    createDailyScore(input: $input) {
      dailyScore {
        id
        date
        skillCategory
        score
      }
      errors {
        message
        path
      }
    }
  }
`;

export const UPDATE_DAILY_SCORE_MUTATION = `
  mutation UpdateDailyScore($input: UpdateDailyScoreInput!) {
    updateDailyScore(input: $input) {
      dailyScore {
        id
        date
        skillCategory
        score
      }
      errors {
        message
        path
      }
    }
  }
`;
