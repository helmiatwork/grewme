import type { PageServerLoad } from './$types';
import { EXAM_BY_ACCESS_CODE_QUERY } from '$lib/api/queries/exam';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: EXAM_BY_ACCESS_CODE_QUERY,
      variables: { code: params.code }
    })
  });
  const json = await res.json();

  return {
    code: params.code,
    examAccess: json.data?.examByAccessCode ?? null
  };
};
