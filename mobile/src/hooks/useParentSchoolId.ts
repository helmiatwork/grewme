import { useMyChildrenWithSchoolQuery } from '../graphql/generated/graphql';

/**
 * Shared hook to extract schoolId and available grades from the parent's first child's classroom.
 * Used by curriculum screens to avoid duplicating the query + extraction logic.
 */
export function useParentSchoolId() {
  const { data, loading, error, refetch } = useMyChildrenWithSchoolQuery();

  const schoolId =
    data?.myChildren?.[0]?.classrooms?.[0]?.school?.id ?? null;

  // Derive unique grades from all children's classrooms
  const grades: number[] = [];
  if (data?.myChildren) {
    const gradeSet = new Set<number>();
    for (const child of data.myChildren) {
      for (const classroom of child.classrooms ?? []) {
        if (classroom.grade != null) {
          gradeSet.add(classroom.grade);
        }
      }
    }
    grades.push(...Array.from(gradeSet).sort((a, b) => a - b));
  }
  // Fallback to 1-6 if no grades found (shouldn't happen in practice)
  const availableGrades = grades.length > 0 ? grades : [1, 2, 3, 4, 5, 6];

  return { schoolId, availableGrades, loading, error, refetch };
}
