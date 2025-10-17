import { gql } from '@apollo/client';

// Типы для GraphQL
export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    userId
    username
    email
    firstName
    lastName
    patronymic
    fullName
    avatar
    status
    lastSeen
    createdAt
    updatedAt
  }
`;

export const CHAT_FRAGMENT = gql`
  fragment ChatFragment on Chat {
    chatId
    type
    name
    description
    participants {
      userId
      username
      fullName
      avatar
      status
    }
    lastMessage {
      _id
      text
      userId
      username
      fullName
      timestamp
      type
    }
    createdAt
    updatedAt
  }
`;

export const MESSAGE_FRAGMENT = gql`
  fragment MessageFragment on Message {
    _id
    text
    userId
    username
    fullName
    chat
    type
    files {
      filename
      originalName
      mimetype
      size
      url
    }
    replyTo {
      _id
      text
      username
      fullName
    }
    forwardedFrom {
      _id
      text
      username
      fullName
      chat
    }
    edited
    timestamp
    createdAt
    updatedAt
  }
`;

export const FILE_FRAGMENT = gql`
  fragment FileFragment on File {
    filename
    originalName
    mimetype
    size
    url
    uploadedAt
  }
`;
