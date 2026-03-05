import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { STUDENT_RADAR_QUERY, STUDENT_PROGRESS_QUERY, STUDENT_DAILY_SCORES_QUERY } from '$lib/api/queries/students';
import type { RadarData, ProgressData, DailyScore, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [radarData, progressData, scoresData] = await Promise.all([
    graphql<{ studentRadar: RadarData }>(
      STUDENT_RADAR_QUERY,
      { studentId: params.id },
      locals.accessToken!
    ),
    graphql<{ studentProgress: ProgressData }>(
      STUDENT_PROGRESS_QUERY,
      { studentId: params.id },
      locals.accessToken!
    ),
    graphql<{ studentDailyScores: Connection<DailyScore> }>(
      STUDENT_DAILY_SCORES_QUERY,
      { studentId: params.id, first: 20 },
      locals.accessToken!
    )
  ]);

  return {
    radar: radarData.studentRadar,
    progress: progressData.studentProgress,
    scores: scoresData.studentDailyScores.nodes
  };
};
