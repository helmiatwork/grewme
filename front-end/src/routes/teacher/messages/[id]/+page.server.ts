import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';

const CONVERSATION_QUERY = `
  query Conversation($id: ID!) {
    conversation(id: $id) {
      id
      student { id name }
      parent { id name }
      teacher { id name }
      messages {
        id
        body
        senderName
        senderType
        senderId
        mine
        createdAt
      }
    }
  }
`;

const MARK_MESSAGES_READ_MUTATION = `
  mutation MarkMessagesRead($conversationId: ID!) {
    markMessagesRead(conversationId: $conversationId) {
      success
    }
  }
`;

export const load: PageServerLoad = async ({ params, locals }) => {
  const [convData] = await Promise.all([
    graphql<{ conversation: any }>(
      CONVERSATION_QUERY,
      { id: params.id },
      locals.accessToken!
    ),
    graphql<any>(
      MARK_MESSAGES_READ_MUTATION,
      { conversationId: params.id },
      locals.accessToken!
    )
  ]);

  return {
    conversation: convData.conversation,
    accessToken: locals.accessToken
  };
};
