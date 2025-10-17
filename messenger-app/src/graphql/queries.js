import { gql } from '@apollo/client';
import { USER_FRAGMENT, CHAT_FRAGMENT, MESSAGE_FRAGMENT } from './types.js';

// Queries для получения данных
export const GET_USERS = gql`
  ${USER_FRAGMENT}
  query GetUsers {
    users {
      ...UserFragment
    }
  }
`;

export const GET_USER_PROFILE = gql`
  ${USER_FRAGMENT}
  query GetUserProfile {
    me {
      ...UserFragment
    }
  }
`;

export const GET_CHATS = gql`
  ${CHAT_FRAGMENT}
  query GetChats {
    chats {
      ...ChatFragment
    }
  }
`;

export const GET_CHAT = gql`
  ${CHAT_FRAGMENT}
  query GetChat($chatId: String!) {
    chat(chatId: $chatId) {
      ...ChatFragment
    }
  }
`;

export const GET_MESSAGES = gql`
  ${MESSAGE_FRAGMENT}
  query GetMessages($chatId: String!, $limit: Int, $offset: Int) {
    messages(chatId: $chatId, limit: $limit, offset: $offset) {
      ...MessageFragment
    }
  }
`;

export const GET_MESSAGE = gql`
  ${MESSAGE_FRAGMENT}
  query GetMessage($messageId: String!) {
    message(messageId: $messageId) {
      ...MessageFragment
    }
  }
`;

export const SEARCH_USERS = gql`
  ${USER_FRAGMENT}
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      ...UserFragment
    }
  }
`;

export const GET_CHAT_PARTICIPANTS = gql`
  ${USER_FRAGMENT}
  query GetChatParticipants($chatId: String!) {
    chat(chatId: $chatId) {
      chatId
      participants {
        ...UserFragment
      }
    }
  }
`;
