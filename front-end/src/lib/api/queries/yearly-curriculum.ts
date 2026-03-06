export const ACADEMIC_YEARS_QUERY = `
  query AcademicYears($schoolId: ID!) {
    academicYears(schoolId: $schoolId) {
      id
      label
      startDate
      endDate
      current
    }
  }
`;

export const GRADE_CURRICULUM_QUERY = `
  query GradeCurriculum($academicYearId: ID!, $grade: Int!) {
    gradeCurriculum(academicYearId: $academicYearId, grade: $grade) {
      id
      grade
      gradeCurriculumItems {
        id
        subject { id name description topics { id name } }
        topic { id name subject { id name } }
        position
        displayName
      }
    }
  }
`;

export const SAVE_GRADE_CURRICULUM_MUTATION = `
  mutation SaveGradeCurriculum($input: SaveGradeCurriculumInput!) {
    saveGradeCurriculum(input: $input) {
      gradeCurriculum {
        id
        grade
        gradeCurriculumItems {
          id
          subject { id name }
          topic { id name }
          position
          displayName
        }
      }
      errors { message path }
    }
  }
`;

export const CREATE_ACADEMIC_YEAR_MUTATION = `
  mutation CreateAcademicYear($input: CreateAcademicYearInput!) {
    createAcademicYear(input: $input) {
      academicYear { id label startDate endDate current }
      errors { message path }
    }
  }
`;

export const UPDATE_ACADEMIC_YEAR_MUTATION = `
  mutation UpdateAcademicYear($input: UpdateAcademicYearInput!) {
    updateAcademicYear(input: $input) {
      academicYear { id label startDate endDate current }
      errors { message path }
    }
  }
`;

export const SET_CURRENT_ACADEMIC_YEAR_MUTATION = `
  mutation SetCurrentAcademicYear($id: ID!) {
    setCurrentAcademicYear(id: $id) {
      academicYear { id label current }
      errors { message path }
    }
  }
`;
