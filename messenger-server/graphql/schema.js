const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Upload
  scalar DateTime

  type User {
    userId: String!
    username: String!
    email: String!
    firstName: String
    lastName: String
    patronymic: String
    fullName: String
    avatar: String
    status: UserStatus!
    lastSeen: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum UserStatus {
    ONLINE
    OFFLINE
    AWAY
    BUSY
  }

  type Chat {
    chatId: String!
    type: ChatType!
    name: String
    description: String
    participants: [User!]!
    lastMessage: Message
    createdAt: DateTime!
    updatedAt: DateTime!
  }

enum ChatType {
  PRIVATE
  GROUP
  FAVORITES
}

  type Message {
    _id: String!
    text: String!
    userId: String!
    username: String!
    fullName: String!
    chat: String!
    type: MessageType!
    files: [File!]
    replyTo: Message
    forwardedFrom: Message
    edited: Boolean!
    timestamp: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum MessageType {
    TEXT
    IMAGE
    FILE
    VOICE
    VIDEO
  }

  type File {
    filename: String!
    originalName: String!
    mimetype: String!
    size: Int!
    url: String!
    uploadedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  type AvatarUploadResponse {
    avatar: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    firstName: String
    lastName: String
    patronymic: String
  }

  input SendMessageInput {
    chatId: String!
    text: String!
    type: MessageType = TEXT
    replyTo: String
    forwardedFrom: String
  }

  input CreateGroupChatInput {
    name: String!
    description: String
    participantIds: [String!]!
  }

  input UpdateChatInput {
    name: String
    description: String
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    patronymic: String
    email: String
  }

  type Query {
    me: User
    users: [User!]!
    chats: [Chat!]!
    chat(chatId: String!): Chat
    messages(chatId: String!, limit: Int, offset: Int): [Message!]!
    message(messageId: String!): Message
    searchUsers(query: String!): [User!]!
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    logout: LogoutResponse!
    
    createPrivateChat(otherUserId: String!): Chat!
    createGroupChat(input: CreateGroupChatInput!): Chat!
    updateChat(chatId: String!, input: UpdateChatInput!): Chat!
    deleteChat(chatId: String!): DeleteResponse!
    
    sendMessage(input: SendMessageInput!): Message!
    editMessage(messageId: String!, text: String!): Message!
    deleteMessage(messageId: String!): DeleteResponse!
    forwardMessage(messageId: String!, targetChatId: String!): Message!
    uploadFiles(chatId: String!, files: [Upload!]!, text: String): Message!
    
    updateProfile(input: UpdateProfileInput!): User!
    uploadAvatar(avatar: Upload!): AvatarUploadResponse!
    
    addChatParticipant(chatId: String!, userId: String!): Chat!
    removeChatParticipant(chatId: String!, userId: String!): Chat!
  }

  type Subscription {
    messageAdded(chatId: String!): Message!
    messageUpdated(chatId: String!): Message!
    messageDeleted(chatId: String!): MessageDeletedPayload!
    userStatusChanged: UserStatusChangedPayload!
    chatUpdated: ChatUpdatedPayload!
    typingStatus(chatId: String!): TypingStatusPayload!
    userJoinedChat(chatId: String!): UserJoinedChatPayload!
    userLeftChat(chatId: String!): UserLeftChatPayload!
  }

  type MessageDeletedPayload {
    messageId: String!
    chatId: String!
  }

  type UserStatusChangedPayload {
    userId: String!
    status: UserStatus!
    lastSeen: DateTime
  }

  type ChatUpdatedPayload {
    chatId: String!
    type: ChatType!
    name: String
    lastMessage: Message
    updatedAt: DateTime!
  }

  type TypingStatusPayload {
    userId: String!
    username: String!
    fullName: String!
    isTyping: Boolean!
    chatId: String!
  }

  type UserJoinedChatPayload {
    userId: String!
    username: String!
    fullName: String!
    chatId: String!
    joinedAt: DateTime!
  }

  type UserLeftChatPayload {
    userId: String!
    username: String!
    fullName: String!
    chatId: String!
    leftAt: DateTime!
  }
`;

module.exports = typeDefs;
