# GraphQL Schema для Messenger App

Этот документ содержит описание GraphQL схемы, которую должен реализовать сервер для работы с клиентским приложением.

## Основные типы

### User
```graphql
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
```

### Chat
```graphql
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
}
```

### Message
```graphql
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
```

### File
```graphql
type File {
  filename: String!
  originalName: String!
  mimetype: String!
  size: Int!
  url: String!
  uploadedAt: DateTime!
}
```

## Queries

```graphql
type Query {
  # Получить текущего пользователя
  me: User
  
  # Получить список всех пользователей
  users: [User!]!
  
  # Получить список чатов пользователя
  chats: [Chat!]!
  
  # Получить конкретный чат
  chat(chatId: String!): Chat
  
  # Получить сообщения чата
  messages(chatId: String!, limit: Int, offset: Int): [Message!]!
  
  # Получить конкретное сообщение
  message(messageId: String!): Message
  
  # Поиск пользователей
  searchUsers(query: String!): [User!]!
}
```

## Mutations

```graphql
type Mutation {
  # Аутентификация
  login(username: String!, password: String!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!
  logout: LogoutResponse!
  
  # Управление чатами
  createPrivateChat(otherUserId: String!): Chat!
  createGroupChat(input: CreateGroupChatInput!): Chat!
  updateChat(chatId: String!, input: UpdateChatInput!): Chat!
  deleteChat(chatId: String!): DeleteResponse!
  
  # Управление сообщениями
  sendMessage(input: SendMessageInput!): Message!
  editMessage(messageId: String!, text: String!): Message!
  deleteMessage(messageId: String!): DeleteResponse!
  forwardMessage(messageId: String!, targetChatId: String!): Message!
  uploadFiles(chatId: String!, files: [Upload!]!, text: String): Message!
  
  # Управление профилем
  updateProfile(input: UpdateProfileInput!): User!
  uploadAvatar(avatar: Upload!): AvatarUploadResponse!
  
  # Управление участниками чата
  addChatParticipant(chatId: String!, userId: String!): Chat!
  removeChatParticipant(chatId: String!, userId: String!): Chat!
}
```

## Subscriptions

```graphql
type Subscription {
  # Подписка на новые сообщения в чате
  messageAdded(chatId: String!): Message!
  
  # Подписка на обновления сообщений
  messageUpdated(chatId: String!): Message!
  
  # Подписка на удаление сообщений
  messageDeleted(chatId: String!): MessageDeletedPayload!
  
  # Подписка на изменения статуса пользователей
  userStatusChanged: UserStatusChangedPayload!
  
  # Подписка на обновления чатов
  chatUpdated: ChatUpdatedPayload!
  
  # Подписка на статус печати
  typingStatus(chatId: String!): TypingStatusPayload!
  
  # Подписка на присоединение пользователей к чату
  userJoinedChat(chatId: String!): UserJoinedChatPayload!
  
  # Подписка на выход пользователей из чата
  userLeftChat(chatId: String!): UserLeftChatPayload!
}
```

## Input типы

```graphql
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
```

## Payload типы

```graphql
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
```

## Скалярные типы

```graphql
scalar Upload
scalar DateTime
```

## Особенности реализации

### Аутентификация
- Все запросы (кроме login/register) требуют JWT токен в заголовке Authorization
- Токен должен содержать userId и username
- При истечении токена возвращается ошибка UNAUTHORIZED

### Кэширование
- Пользователи кэшируются по userId
- Чаты кэшируются с обновлением lastMessage
- Сообщения кэшируются по chatId с пагинацией

### Real-time обновления
- Используется WebSocket для subscriptions
- Автоматическое переподключение при потере соединения
- Подписка на изменения только для активного чата

### Загрузка файлов
- Поддержка multipart/form-data для Upload скаляра
- Максимальный размер файла: 10MB
- Поддерживаемые типы: изображения, документы, аудио, видео

### Обработка ошибок
- Все ошибки возвращаются в стандартном формате GraphQL
- Сетевые ошибки обрабатываются отдельно
- Автоматический logout при ошибках авторизации
