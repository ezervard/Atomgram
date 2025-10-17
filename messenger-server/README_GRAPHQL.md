# GraphQL Server для Messenger App

Этот документ описывает GraphQL сервер, который работает параллельно с существующим REST API.

## 🚀 Возможности

- **GraphQL API** - современный API с типизацией
- **Real-time подписки** - WebSocket для live обновлений
- **Загрузка файлов** - поддержка Upload скаляра
- **Аутентификация** - JWT токены
- **Совместимость** - работает параллельно с REST API

## 📁 Структура файлов

```
messenger-server/
├── graphql/
│   ├── schema.js          # GraphQL схема
│   ├── resolvers.js       # Резолверы для операций
│   ├── server.js          # Настройка Apollo Server
│   └── uploadHandler.js   # Обработка загрузки файлов
├── models/                # Mongoose модели (без изменений)
├── routes/                # REST API роуты (без изменений)
└── server.js              # Основной файл сервера
```

## 🔧 Установка и запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск сервера
```bash
# Production
npm start

# Development
npm run dev
```

### 3. Доступные endpoints
- **GraphQL API**: `http://localhost:8080/graphql`
- **GraphQL Playground**: `http://localhost:8080/graphql` (в браузере)
- **WebSocket**: `ws://localhost:8080/graphql`
- **REST API**: `http://localhost:8080/auth`, `/chats`, `/messages`

## 📊 GraphQL Schema

### Основные типы

#### User
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
```

#### Chat
```graphql
type Chat {
  chatId: String!
  type: ChatType!
  name: String
  participants: [User!]!
  lastMessage: Message
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Message
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
  edited: Boolean!
  timestamp: DateTime!
}
```

## 🔐 Аутентификация

### HTTP запросы
Добавьте заголовок:
```
Authorization: Bearer <your_jwt_token>
```

### WebSocket соединения
```javascript
const wsClient = createClient({
  url: 'ws://localhost:8080/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`
  }
});
```

## 📝 Примеры запросов

### 1. Аутентификация
```graphql
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
    user {
      userId
      username
      fullName
    }
  }
}
```

### 2. Получение чатов
```graphql
query GetChats {
  chats {
    chatId
    type
    participants {
      userId
      username
      fullName
      status
    }
    lastMessage {
      text
      timestamp
    }
  }
}
```

### 3. Отправка сообщения
```graphql
mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    _id
    text
    userId
    timestamp
  }
}
```

### 4. Подписка на сообщения
```graphql
subscription MessageAdded($chatId: String!) {
  messageAdded(chatId: $chatId) {
    _id
    text
    userId
    username
    timestamp
  }
}
```

### 5. Загрузка файлов
```graphql
mutation UploadFiles($chatId: String!, $files: [Upload!]!, $text: String) {
  uploadFiles(chatId: $chatId, files: $files, text: $text) {
    _id
    text
    files {
      filename
      originalName
      url
      size
    }
  }
}
```

## 🔄 Subscriptions

### Доступные подписки

1. **messageAdded** - новые сообщения в чате
2. **messageUpdated** - обновления сообщений
3. **messageDeleted** - удаление сообщений
4. **userStatusChanged** - изменения статуса пользователей

### Пример использования
```javascript
import { useSubscription } from '@apollo/client';

const { data } = useSubscription(MESSAGE_ADDED, {
  variables: { chatId: 'CHAT123' },
  onData: ({ data }) => {
    console.log('Новое сообщение:', data.messageAdded);
  }
});
```

## 📁 Загрузка файлов

### Поддерживаемые типы
- **Изображения**: jpg, png, gif, webp
- **Документы**: pdf, doc, docx, txt
- **Аудио**: mp3, wav, ogg
- **Видео**: mp4, avi, mov
- **Архивы**: zip, rar, 7z

### Ограничения
- Максимальный размер файла: 10MB
- Максимальное количество файлов: 10 за раз

## 🛠 Разработка

### Добавление нового резолвера

1. **Добавьте тип в схему** (`graphql/schema.js`):
```graphql
type Query {
  myNewQuery: MyType!
}
```

2. **Создайте резолвер** (`graphql/resolvers.js`):
```javascript
Query: {
  myNewQuery: async (_, args, context) => {
    const user = authenticateUser(context);
    // Ваша логика
    return result;
  }
}
```

### Добавление новой подписки

1. **Добавьте тип в схему**:
```graphql
type Subscription {
  myNewSubscription: MyPayload!
}
```

2. **Создайте резолвер**:
```javascript
Subscription: {
  myNewSubscription: {
    subscribe: (_, args, context) => {
      return pubsub.asyncIterator(['MY_EVENT']);
    }
  }
}
```

3. **Публикуйте события**:
```javascript
pubsub.publish('MY_EVENT', {
  myNewSubscription: data
});
```

## 🐛 Отладка

### GraphQL Playground
Откройте `http://localhost:8080/graphql` в браузере для:
- Интерактивного выполнения запросов
- Просмотра схемы
- Отладки ошибок

### Логи
Сервер выводит подробные логи:
- HTTP запросы
- GraphQL операции
- WebSocket соединения
- Ошибки

## 🔧 Конфигурация

### Переменные окружения
```bash
PORT=8080                    # Порт сервера
HOST=10.185.101.19          # Хост сервера
MONGODB_URI=mongodb://...   # MongoDB URI
JWT_SECRET=your_secret      # Секрет для JWT
CLIENT_ORIGIN=http://...    # CORS origin
```

## 📈 Производительность

### Кэширование
- Apollo Server автоматически кэширует запросы
- Mongoose кэширует подключения к MongoDB

### Оптимизация
- Пагинация для сообщений
- Ленивая загрузка участников чатов
- Индексы в MongoDB

## 🚀 Миграция с REST API

### Постепенная миграция
1. **Этап 1**: GraphQL работает параллельно с REST
2. **Этап 2**: Новые функции только в GraphQL
3. **Этап 3**: Постепенный перевод клиента
4. **Этап 4**: Удаление устаревших REST endpoints

### Совместимость
- Общие модели Mongoose
- Общая аутентификация
- Общие файлы загрузок

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Используйте GraphQL Playground для тестирования
3. Проверьте переменные окружения
4. Убедитесь, что MongoDB запущена

## 🔄 Обновления

### v1.0.0
- ✅ Базовый GraphQL API
- ✅ Real-time subscriptions
- ✅ Загрузка файлов
- ✅ Аутентификация
- ✅ Совместимость с REST API
