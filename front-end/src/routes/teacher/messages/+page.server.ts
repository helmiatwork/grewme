import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';

const CONVERSATIONS_QUERY = `
  query {
    conversations {
      id
      student { id name }
      parent { id name }
      teacher { id name }
      lastMessage { id body senderName senderType createdAt }
      unreadCount
    }
    groupConversations {
      id
      name
      classroom { id name }
      lastMessage { id body senderName senderType createdAt }
    }
    classrooms {
      id
      name
    }
  }
`;

export const load: PageServerLoad = async ({ locals }) => {
  const data = await graphql<any>(CONVERSATIONS_QUERY, {}, locals.accessToken!);
  return {
    conversations: data.conversations ?? [],
    groupConversations: data.groupConversations ?? [],
    classrooms: data.classrooms ?? [],
    accessToken: locals.accessToken
  };
};
