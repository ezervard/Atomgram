# Быстрый старт GraphQL сервера

## 🚀 Запуск сервера

### 1. Установите зависимости (если еще не установлены)
```bash
cd c:\Work\Atom\Atomgram\messenger-server
npm install graphql-subscriptions
```

### 2. Запустите сервер
```bash
node server.js
```

### 3. Проверьте, что сервер запущен
Вы должны увидеть:
```
Подключено к MongoDB
Сервер запущен на 10.185.101.19:8080
REST API доступен на 10.185.101.19:8080/auth, /chats, /messages
GraphQL API доступен на 10.185.101.19:8080/graphql
GraphQL Playground доступен на 10.185.101.19:8080/graphql
```

## 🧪 Тестирование GraphQL API

### Откройте GraphQL Playground
Откройте в браузере: `http://10.185.101.19:8080/graphql`

### Пример 1: Регистрация пользователя
```graphql
mutation Register {
  register(input: {
    username: "testuser"
    email: "test@example.com"
    password: "password123"
    firstName: "Иван"
    lastName: "Иванов"
  }) {
    token
    user {
      userId
      username
      fullName
    }
  }
}
```

### Пример 2: Вход в систему
```graphql
mutation Login {
  login(username: "testuser", password: "password123") {
    token
    user {
      userId
      username
      fullName
    }
  }
}
```

### Пример 3: Получение пользователей (требуется токен)
```graphql
query GetUsers {
  users {
    userId
    username
    fullName
    status
  }
}
```

**Важно**: Добавьте токен в HTTP Headers:
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

### Пример 4: Создание приватного чата
```graphql
mutation CreateChat {
  createPrivateChat(otherUserId: "USER_ID_HERE") {
    chatId
    type
    participants {
      userId
      username
      fullName
    }
  }
}
```

### Пример 5: Отправка сообщения
```graphql
mutation SendMessage {
  sendMessage(input: {
    chatId: "CHAT_ID_HERE"
    text: "Привет! Это тестовое сообщение"
    type: TEXT
  }) {
    _id
    text
    userId
    username
    timestamp
  }
}
```

### Пример 6: Получение сообщений
```graphql
query GetMessages {
  messages(chatId: "CHAT_ID_HERE") {
    _id
    text
    userId
    username
    fullName
    timestamp
    files {
      filename
      url
    }
  }
}
```

## ⚠️ Важные замечания

### WebSocket Subscriptions
На данный момент WebSocket subscriptions отключены из-за проблем совместимости с graphql-ws.
Для real-time обновлений используйте существующий Socket.IO сервер.

Если нужны GraphQL subscriptions:
1. Обновите graphql-ws до совместимой версии
2. Используйте `graphql/server.js` вместо `graphql/server-simple.js`

### REST API
REST API продолжает работать параллельно:
- `/auth/register` - регистрация
- `/auth/login` - вход
- `/auth/users` - список пользователей
- `/chats` - чаты
- `/messages/:chatId` - сообщения

## 🐛 Решение проблем

### Ошибка подключения к MongoDB
Убедитесь, что MongoDB запущена:
```bash
# Windows
net start MongoDB

# Или проверьте URI в server.js
mongodb://localhost/grok_messenger_new
```

### Ошибка "Token недействителен"
1. Получите новый токен через login/register
2. Добавьте его в HTTP Headers
3. Токены действительны 24 часа

### Ошибка импорта graphql-ws
Используется упрощенная версия сервера (`server-simple.js`), которая работает без WebSocket subscriptions.

## 📚 Дополнительная информация

Полная документация: `README_GRAPHQL.md`

Схема GraphQL: `graphql/schema.js`

Примеры клиентского кода: `../messenger-app/src/graphql/`
