# API Документация для Мессенджера

Этот документ описывает все эндпоинты REST API и события Socket.IO, реализованные в `server.js` для корпоративного мессенджера. База URL для всех эндпоинтов: `http://localhost:8080`.

## REST API Эндпоинты

### 1. Регистрация пользователя
- **Эндпоинт**: `/register`
- **Метод**: POST
- **Описание**: Регистрирует нового пользователя с логином, email, паролем и персональными данными.
- **Тело запроса** (JSON):
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "patronymic": "string" (необязательно)
  }
  ```
- **Заголовки**:
  - `Content-Type: application/json`
- **Пример запроса**:
  ```bash
  curl -X POST http://localhost:8080/register -H "Content-Type: application/json" -d "{\"username\":\"roman123\",\"email\":\"roman@example.com\",\"password\":\"password123\",\"firstName\":\"Роман\",\"lastName\":\"Иванов\",\"patronymic\":\"\"}"
  ```
- **Ожидаемый ответ** (200):
  ```json
  {
    "token": "<jwt_token>",
    "username": "roman123",
    "fullName": "Роман Иванов",
    "email": "roman@example.com"
  }
  ```
- **Ошибки**:
  - **400**: `"Все поля обязательны, кроме отчества"`
  - **400**: `"Пользователь с таким логином или email уже существует"`
  - **500**: `"Ошибка регистрации"`

### 2. Авторизация пользователя
- **Эндпоинт**: `/login`
- **Метод**: POST
- **Описание**: Авторизует пользователя по логину и паролю.
- **Тело запроса** (JSON):
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Заголовки**:
  - `Content-Type: application/json`
- **Пример запроса**:
  ```bash
  curl -X POST http://localhost:8080/login -H "Content-Type: application/json" -d "{\"username\":\"roman123\",\"password\":\"password123\"}"
  ```
- **Ожидаемый ответ** (200):
  ```json
  {
    "token": "<jwt_token>",
    "username": "roman123",
    "fullName": "Роман Иванов",
    "email": "roman@example.com"
  }
  ```
- **Ошибки**:
  - **400**: `"Логин и пароль обязательны"`
  - **400**: `"Пользователь не найден"`
  - **400**: `"Неверный пароль"`
  - **500**: `"Ошибка авторизации"`

### 3. Получение списка пользователей
- **Эндпоинт**: `/users`
- **Метод**: GET
- **Описание**: Возвращает список всех пользователей (кроме текущего) с их статусами.
- **Параметры**: Нет
- **Заголовки**:
  - `Authorization: Bearer <jwt_token>`
- **Пример запроса**:
  ```bash
  curl -X GET http://localhost:8080/users -H "Authorization: Bearer <jwt_token>"
  ```
- **Ожидаемый ответ** (200):
  ```json
  [
    {
      "username": "user2",
      "email": "user2@example.com",
      "fullName": "Два Пользователь",
      "status": "offline"
    }
  ]
  ```
- **Ошибки**:
  - **401**: `"Токен не предоставлен"`
  - **403**: `"Неверный токен"`
  - **500**: `"Ошибка получения списка пользователей"`

### 4. Получение списка чатов
- **Эндпоинт**: `/chats`
- **Метод**: GET
- **Описание**: Возвращает список чатов текущего пользователя (личные и групповые).
- **Параметры**: Нет
- **Заголовки**:
  - `Authorization: Bearer <jwt_token>`
- **Пример запроса**:
  ```bash
  curl -X GET http://localhost:8080/chats -H "Authorization: Bearer <jwt_token>"
  ```
- **Ожидаемый ответ** (200):
  ```json
  [
    {
      "chatId": "private_roman@example.com_user2@example.com",
      "type": "private",
      "name": "Два Пользователь",
      "participants": ["roman@example.com", "user2@example.com"],
      "status": "offline"
    }
  ]
  ```
- **Ошибки**:
  - **401**: `"Токен не предоставлен"`
  - **403**: `"Неверный токен"`
  - **500**: `"Ошибка получения списка чатов"`

### 5. Создание личного чата
- **Эндпоинт**: `/create-chat`
- **Метод**: POST
- **Описание**: Создает личный чат с другим пользователем.
- **Тело запроса** (JSON):
  ```json
  {
    "otherUserEmail": "string"
  }
  ```
- **Заголовки**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Пример запроса**:
  ```bash
  curl -X POST http://localhost:8080/create-chat -H "Content-Type: application/json" -H "Authorization: Bearer <jwt_token>" -d "{\"otherUserEmail\":\"user2@example.com\"}"
  ```
- **Ожидаемый ответ** (200):
  ```json
  {
    "chatId": "private_roman@example.com_user2@example.com",
    "type": "private",
    "name": "Два Пользователь",
    "participants": ["roman@example.com", "user2@example.com"],
    "status": "offline"
  }
  ```
- **Ошибки**:
  - **400**: `"Email другого пользователя обязателен"`
  - **400**: `"Пользователь не найден"`
  - **500**: `"Ошибка создания чата"`

### 6. Получение сообщений для чата
- **Эндпоинт**: `/messages/:chat`
- **Метод**: GET
- **Описание**: Возвращает сообщения для указанного чата.
- **Параметры пути**: `:chat` (например, `private_roman@example.com_user2@example.com`)
- **Заголовки**:
  - `Authorization: Bearer <jwt_token>`
- **Пример запроса**:
  ```bash
  curl -X GET http://localhost:8080/messages/private_roman@example.com_user2@example.com -H "Authorization: Bearer <jwt_token>"
  ```
- **Ожидаемый ответ** (200):
  ```json
  [
    {
      "_id": "...",
      "username": "roman123",
      "fullName": "Роман Иванов",
      "chat": "private_roman@example.com_user2@example.com",
      "text": "Привет!",
      "timestamp": "2025-08-19T..."
    }
  ]
  ```
- **Ошибки**:
  - **401**: `"Токен не предоставлен"`
  - **403**: `"Неверный токен"`
  - **500**: `"Не удалось загрузить сообщения"`

## Socket.IO События

### 1. connection
- **Описание**: Происходит при подключении клиента.
- **Данные**: `{ token: string }` в `socket.handshake.auth`
- **Ответное событие**: `userStatus`
- **Данные ответа**:
  ```json
  {
    "email": "string",
    "status": "online" | "offline"
  }
  ```
- **Пример**:
  ```json
  {
    "email": "roman@example.com",
    "status": "online"
  }
  ```

### 2. joinChat
- **Описание**: Клиент присоединяется к чату.
- **Данные**: `chat: string` (например, `private_roman@example.com_user2@example.com`)
- **Ответное событие**: Нет

### 3. message
- **Описание**: Клиент отправляет сообщение.
- **Данные**:
  ```json
  {
    "username": "string",
    "chat": "string",
    "text": "string",
    "timestamp": "string"
  }
  ```
- **Ответное событие**: `message`
- **Данные ответа**:
  ```json
  {
    "username": "string",
    "fullName": "string",
    "chat": "string",
    "text": "string",
    "timestamp": "Date"
  }
  ```
- **Пример**:
  ```json
  {
    "username": "roman123",
    "fullName": "Роман Иванов",
    "chat": "private_roman@example.com_user2@example.com",
    "text": "Привет!",
    "timestamp": "2025-08-19T..."
  }
  ```

### 4. disconnect
- **Описание**: Клиент отключается.
- **Данные**: Нет
- **Ответное событие**: `userStatus`
- **Данные ответа**:
  ```json
  {
    "email": "string",
    "status": "offline"
  }
  ```
- **Пример**:
  ```json
  {
    "email": "roman@example.com",
    "status": "offline"
  }
  ```

## Примечания
- Все эндпоинты, кроме `/register` и `/login`, требуют JWT-токен в заголовке `Authorization: Bearer <jwt_token>`.
- Сообщения в базе данных (`messages`) содержат поля `username` и `fullName` для идентификации и отображения отправителя.
- Для тестирования используйте `curl`, Postman или клиентский интерфейс (`App.jsx`).
