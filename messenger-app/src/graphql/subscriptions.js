import { gql } from '@apollo/client';
import { MESSAGE_FRAGMENT, USER_FRAGMENT } from './types.js';

// Subscriptions для real-time обновлений

export const MESSAGE_ADDED = gql`
  ${MESSAGE_FRAGMENT}
  subscription MessageAdded($chatId: String!) {
    messageAdded(chatId: $chatId) {
      ...MessageFragment
    }
  }
`;

export const MESSAGE_UPDATED = gql`
  ${MESSAGE_FRAGMENT}
  subscription MessageUpdated($chatId: String!) {
    messageUpdated(chatId: $chatId) {
      ...MessageFragment
    }
  }
`;

export const MESSAGE_DELETED = gql`
  subscription MessageDeleted($chatId: String!) {
    messageDeleted(chatId: $chatId) {
      messageId
      chatId
    }
  }
`;

export const USER_STATUS_CHANGED = gql`
  ${USER_FRAGMENT}
  subscription UserStatusChanged {
    userStatusChanged {
      userId
      status
      lastSeen
    }
  }
`;

export const CHAT_UPDATED = gql`
  subscription ChatUpdated {
    chatUpdated {
      chatId
      type
      name
      lastMessage {
        _id
        text
        userId
        username
        fullName
        timestamp
        type
      }
      updatedAt
    }
  }
`;

export const TYPING_STATUS = gql`
  subscription TypingStatus($chatId: String!) {
    typingStatus(chatId: $chatId) {
      userId
      username
      fullName
      isTyping
      chatId
    }
  }
`;

export const USER_JOINED_CHAT = gql`
  subscription UserJoinedChat($chatId: String!) {
    userJoinedChat(chatId: $chatId) {
      userId
      username
      fullName
      chatId
      joinedAt
    }
  }
`;

export const USER_LEFT_CHAT = gql`
  subscription UserLeftChat($chatId: String!) {
    userLeftChat(chatId: $chatId) {
      userId
      username
      fullName
      chatId
      leftAt
    }
  }
`;
