export const FEED_POSTS_QUERY = `
  query FeedPosts($classroomIds: [ID!], $first: Int, $after: String) {
    feedPosts(classroomIds: $classroomIds, first: $first, after: $after) {
      nodes {
        id
        body
        teacher { name }
        classroom { id name }
        mediaUrls
        likesCount
        commentsCount
        likedByMe
        createdAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const FEED_POST_QUERY = `
  query FeedPost($id: ID!) {
    feedPost(id: $id) {
      id
      body
      teacher { name }
      classroom { id name }
      mediaUrls
      likesCount
      commentsCount
      likedByMe
      comments {
        id
        body
        commenterName
        commenterType
        isMine
        createdAt
      }
      createdAt
    }
  }
`;

export const CREATE_FEED_POST_MUTATION = `
  mutation CreateFeedPost($classroomId: ID!, $body: String!, $signedBlobIds: [String!]) {
    createFeedPost(classroomId: $classroomId, body: $body, signedBlobIds: $signedBlobIds) {
      feedPost { id }
      errors { message path }
    }
  }
`;

export const LIKE_FEED_POST_MUTATION = `
  mutation LikeFeedPost($id: ID!) {
    likeFeedPost(id: $id) {
      feedPost { id likesCount likedByMe }
    }
  }
`;

export const COMMENT_ON_FEED_POST_MUTATION = `
  mutation CommentOnFeedPost($id: ID!, $body: String!) {
    commentOnFeedPost(id: $id, body: $body) {
      comment { id body commenterName createdAt }
      errors { message path }
    }
  }
`;

export const DELETE_FEED_POST_MUTATION = `
  mutation DeleteFeedPost($id: ID!) {
    deleteFeedPost(id: $id) { success }
  }
`;

export const DELETE_FEED_COMMENT_MUTATION = `
  mutation DeleteFeedComment($id: ID!) {
    deleteFeedComment(id: $id) { success }
  }
`;

export const CREATE_DIRECT_UPLOAD_MUTATION = `
  mutation CreateDirectUpload($filename: String!, $byteSize: Int!, $contentType: String!, $checksum: String!) {
    createDirectUpload(filename: $filename, byteSize: $byteSize, contentType: $contentType, checksum: $checksum) {
      directUpload { url headers signedBlobId }
      errors { message path }
    }
  }
`;
