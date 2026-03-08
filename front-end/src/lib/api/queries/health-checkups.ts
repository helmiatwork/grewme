export const CREATE_HEALTH_CHECKUP_MUTATION = `
  mutation CreateHealthCheckup($studentId: ID!, $measuredAt: ISO8601Date!, $weightKg: Float, $heightCm: Float, $headCircumferenceCm: Float, $notes: String) {
    createHealthCheckup(studentId: $studentId, measuredAt: $measuredAt, weightKg: $weightKg, heightCm: $heightCm, headCircumferenceCm: $headCircumferenceCm, notes: $notes) {
      healthCheckup {
        id measuredAt weightKg heightCm headCircumferenceCm bmi bmiCategory notes
      }
      errors { message path }
    }
  }
`;

export const STUDENT_HEALTH_CHECKUPS_QUERY = `
  query StudentHealthCheckups($studentId: ID!, $startDate: ISO8601Date, $endDate: ISO8601Date) {
    studentHealthCheckups(studentId: $studentId, startDate: $startDate, endDate: $endDate) {
      id
      measuredAt
      weightKg
      heightCm
      headCircumferenceCm
      bmi
      bmiCategory
      notes
      createdAt
    }
  }
`;
