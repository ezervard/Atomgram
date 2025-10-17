import { gql } from '@apollo/client';
import { USER_FRAGMENT, CHAT_FRAGMENT, MESSAGE_FRAGMENT } from './types.js';

// Mutations для изменения данных

// Аутентификация
export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        ...UserFragment
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...UserFragment
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

// Чаты
export const CREATE_PRIVATE_CHAT = gql`
  ${CHAT_FRAGMENT}
  mutation CreatePrivateChat($otherUserId: String!) {
    createPrivateChat(otherUserId: $otherUserId) {
      ...ChatFragment
    }
  }
`;

export const CREATE_GROUP_CHAT = gql`
  ${CHAT_FRAGMENT}
  mutation CreateGroupChat($input: CreateGroupChatInput!) {
    createGroupChat(input: $input) {
      ...ChatFragment
    }
  }
`;

export const UPDATE_CHAT = gql`
  ${CHAT_FRAGMENT}
  mutation UpdateChat($chatId: String!, $input: UpdateChatInput!) {
    updateChat(chatId: $chatId, input: $input) {
      ...ChatFragment
    }
  }
`;

export const DELETE_CHAT = gql`
  mutation DeleteChat($chatId: String!) {
    deleteChat(chatId: $chatId) {
      success
      message
    }
  }
`;

// Сообщения
export const SEND_MESSAGE = gql`
  ${MESSAGE_FRAGMENT}
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      ...MessageFragment
    }
  }
`;

export const EDIT_MESSAGE = gql`
  ${MESSAGE_FRAGMENT}
  mutation EditMessage($messageId: String!, $text: String!) {
    editMessage(messageId: $messageId, text: $text) {
      ...MessageFragment
    }
  }
`;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageId: String!) {
    deleteMessage(messageId: $messageId) {
      success
      message
    }
  }
`;

export const FORWARD_MESSAGE = gql`
  ${MESSAGE_FRAGMENT}
  mutation ForwardMessage($messageId: String!, $targetChatId: String!) {
    forwardMessage(messageId: $messageId, targetChatId: $targetChatId) {
      ...MessageFragment
    }
  }
`;

export const UPLOAD_FILES = gql`
  mutation UploadFiles($chatId: String!, $files: [Upload!]!, $text: String) {
    uploadFiles(chatId: $chatId, files: $files, text: $text) {
      ...MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;

// Профиль пользователя
export const UPDATE_PROFILE = gql`
  ${USER_FRAGMENT}
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFragment
    }
  }
`;

export const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($avatar: Upload!) {
    uploadAvatar(avatar: $avatar) {
      avatar
    }
  }
`;

// Чат участники
export const ADD_CHAT_PARTICIPANT = gql`
  ${CHAT_FRAGMENT}
  mutation AddChatParticipant($chatId: String!, $userId: String!) {
    addChatParticipant(chatId: $chatId, userId: $userId) {
      ...ChatFragment
    }
  }
`;

export const REMOVE_CHAT_PARTICIPANT = gql`
  ${CHAT_FRAGMENT}
  mutation RemoveChatParticipant($chatId: String!, $userId: String!) {
    removeChatParticipant(chatId: $chatId, userId: $userId) {
      ...ChatFragment
    }
  }
`;
