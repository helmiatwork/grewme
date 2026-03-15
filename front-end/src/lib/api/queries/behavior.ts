export const BEHAVIOR_CATEGORIES_QUERY = `
  query BehaviorCategories($schoolId: ID!) {
    behaviorCategories(schoolId: $schoolId) {
      id
      name
      description
      pointValue
      isPositive
      icon
      color
      position
    }
  }
`;

export const CLASSROOM_BEHAVIOR_TODAY_QUERY = `
  query ClassroomBehaviorToday($classroomId: ID!) {
    classroomBehaviorToday(classroomId: $classroomId) {
      student {
        id
        name
      }
      totalPoints
      positiveCount
      negativeCount
      recentPoints {
        id
        pointValue
        note
        awardedAt
        revokable
        behaviorCategory {
          name
          icon
          color
        }
      }
    }
  }
`;

export const STUDENT_BEHAVIOR_HISTORY_QUERY = `
  query StudentBehaviorHistory($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
    studentBehaviorHistory(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
      id
      pointValue
      note
      awardedAt
      revokedAt
      revokable
      behaviorCategory {
        id
        name
        icon
        color
        pointValue
      }
      teacher {
        id
        name
      }
    }
  }
`;

export const STUDENT_WEEKLY_REPORT_QUERY = `
  query StudentWeeklyReport($studentId: ID!) {
    studentWeeklyReport(studentId: $studentId) {
      id
      weekStart
      totalPoints
      positiveCount
      negativeCount
      student {
        id
        name
      }
      topBehaviorCategory {
        id
        name
        icon
        color
      }
    }
  }
`;

export const CLASSROOM_BEHAVIOR_SUMMARY_QUERY = `
  query ClassroomBehaviorSummary($classroomId: ID!, $weekStart: ISO8601Date!) {
    classroomBehaviorSummary(classroomId: $classroomId, weekStart: $weekStart) {
      id
      weekStart
      totalPoints
      positiveCount
      negativeCount
      student {
        id
        name
      }
      topBehaviorCategory {
        name
        icon
      }
    }
  }
`;

export const AWARD_BEHAVIOR_POINT_MUTATION = `
  mutation AwardBehaviorPoint($studentId: ID!, $classroomId: ID!, $behaviorCategoryId: ID!, $note: String) {
    awardBehaviorPoint(studentId: $studentId, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId, note: $note) {
      behaviorPoint {
        id
        pointValue
        note
        awardedAt
        revokable
        behaviorCategory {
          name
          icon
          color
        }
      }
      dailyTotal
      errors {
        message
        path
      }
    }
  }
`;

export const BATCH_AWARD_MUTATION = `
  mutation BatchAwardBehaviorPoints($studentIds: [ID!]!, $classroomId: ID!, $behaviorCategoryId: ID!) {
    batchAwardBehaviorPoints(studentIds: $studentIds, classroomId: $classroomId, behaviorCategoryId: $behaviorCategoryId) {
      behaviorPoints {
        id
        pointValue
        student {
          id
          name
        }
      }
      errors {
        message
        path
      }
    }
  }
`;

export const REVOKE_BEHAVIOR_POINT_MUTATION = `
  mutation RevokeBehaviorPoint($id: ID!) {
    revokeBehaviorPoint(id: $id) {
      behaviorPoint {
        id
        revokedAt
      }
      errors {
        message
        path
      }
    }
  }
`;

export const CREATE_BEHAVIOR_CATEGORY_MUTATION = `
  mutation CreateBehaviorCategory($schoolId: ID!, $name: String!, $pointValue: Int!, $icon: String!, $color: String!, $description: String) {
    createBehaviorCategory(schoolId: $schoolId, name: $name, pointValue: $pointValue, icon: $icon, color: $color, description: $description) {
      behaviorCategory {
        id
        name
        description
        pointValue
        isPositive
        icon
        color
        position
      }
      errors {
        message
        path
      }
    }
  }
`;

export const UPDATE_BEHAVIOR_CATEGORY_MUTATION = `
  mutation UpdateBehaviorCategory($id: ID!, $name: String, $pointValue: Int, $icon: String, $color: String, $description: String) {
    updateBehaviorCategory(id: $id, name: $name, pointValue: $pointValue, icon: $icon, color: $color, description: $description) {
      behaviorCategory {
        id
        name
        description
        pointValue
        isPositive
        icon
        color
      }
      errors {
        message
        path
      }
    }
  }
`;

export const DELETE_BEHAVIOR_CATEGORY_MUTATION = `
  mutation DeleteBehaviorCategory($id: ID!) {
    deleteBehaviorCategory(id: $id) {
      success
      errors {
        message
        path
      }
    }
  }
`;

export const REORDER_BEHAVIOR_CATEGORIES_MUTATION = `
  mutation ReorderBehaviorCategories($categoryIds: [ID!]!) {
    reorderBehaviorCategories(categoryIds: $categoryIds) {
      behaviorCategories {
        id
        name
        position
      }
      errors {
        message
        path
      }
    }
  }
`;
