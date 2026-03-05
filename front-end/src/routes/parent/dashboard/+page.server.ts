import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { MY_CHILDREN_QUERY } from '$lib/api/queries/parents';
import { STUDENT_RADAR_QUERY } from '$lib/api/queries/students';
import type { Student, RadarData, RadarSkills } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const childrenData = await graphql<{ myChildren: Student[] }>(
    MY_CHILDREN_QUERY,
    {},
    locals.accessToken!
  );

  // Load radar data for each child
  const childrenWithRadar = await Promise.all(
    childrenData.myChildren.map(async (child) => {
      try {
        const radarData = await graphql<{ studentRadar: RadarData }>(
          STUDENT_RADAR_QUERY,
          { studentId: child.id },
          locals.accessToken!
        );
        return { ...child, radar: radarData.studentRadar.skills };
      } catch {
        return { ...child, radar: null as RadarSkills | null };
      }
    })
  );

  return { children: childrenWithRadar };
};
