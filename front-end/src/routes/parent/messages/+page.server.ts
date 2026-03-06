import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';

const CONVERSATIONS_QUERY = `
  query Conversations {
    conversations {
      id
      student { id name }
      parent { id name }
      teacher { id name }
      lastMessage { id body senderName senderType createdAt }
      unreadCount
    }
  }
`;

export const load: PageServerLoad = async ({ locals }) => {
  const data = await graphql<{ conversations: any[] }>(
    CONVERSATIONS_QUERY,
    {},
    locals.accessToken!
  );

  return {
    conversations: data.conversations
  };
};
