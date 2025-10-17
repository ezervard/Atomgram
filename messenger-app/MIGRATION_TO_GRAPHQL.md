# Миграция на GraphQL + Apollo Client

Этот документ описывает процесс миграции приложения с REST API + Socket.IO на GraphQL + Apollo Client.

## Что было изменено

### 1. Установлены новые зависимости
```bash
npm install @apollo/client graphql graphql-ws ws
```

### 2. Создана новая структура файлов

```
src/
├── lib/
│   └── apolloClient.js          # Конфигурация Apollo Client
├── graphql/
│   ├── types.js                 # GraphQL фрагменты
│   ├── queries.js               # GraphQL запросы
│   ├── mutations.js             # GraphQL мутации
│   ├── subscriptions.js         # GraphQL подписки
│   ├── schema.js                # Локальная схема типов
│   └── utils.js                 # Утилиты для работы с GraphQL
├── hooks/
│   ├── useChat.js               # Старый хук (оставлен для совместимости)
│   └── useChatGraphQL.js        # Новый хук с GraphQL
└── App.jsx                      # Обновлен для использования Apollo Provider
```

### 3. Основные изменения

#### Apollo Client конфигурация
- HTTP ссылка для queries и mutations
- WebSocket ссылка для subscriptions
- Автоматическое добавление JWT токена в заголовки
- Оптимизированное кэширование

#### GraphQL операции
- **Queries**: получение пользователей, чатов, сообщений
- **Mutations**: аутентификация, создание чатов, отправка сообщений
- **Subscriptions**: real-time обновления сообщений и статусов

#### Новый хук useChatGraphQL
- Полная замена useChat с использованием Apollo Client
- Автоматическое кэширование и обновление данных
- Real-time подписки вместо Socket.IO
- Оптимистичные обновления UI

## Как использовать

### 1. Обновление App.jsx
```jsx
import { ApolloProvider } from '@apollo/client';
import apolloClient from './lib/apolloClient';
import useChatGraphQL from './hooks/useChatGraphQL';

function App() {
  const chatData = useChatGraphQL();
  
  return (
    <ApolloProvider client={apolloClient}>
      {/* Ваш компонент */}
    </ApolloProvider>
  );
}
```

### 2. Использование в компонентах
```jsx
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS, SEND_MESSAGE } from '../graphql/queries';

function MyComponent() {
  const { data: users } = useQuery(GET_USERS);
  const [sendMessage] = useMutation(SEND_MESSAGE);
  
  // Использование данных
}
```

## Преимущества GraphQL

### 1. Типобезопасность
- Строгая типизация данных
- Автокомплит в IDE
- Проверка типов на этапе компиляции

### 2. Эффективность
- Запрос только нужных данных
- Автоматическое кэширование
- Оптимистичные обновления

### 3. Real-time обновления
- GraphQL Subscriptions вместо Socket.IO
- Автоматическое управление подписками
- Лучшая интеграция с кэшем

### 4. Developer Experience
- Apollo DevTools для отладки
- Автоматическая генерация типов
- Встроенная обработка ошибок

## Миграция с REST API

### Старый способ (REST + Socket.IO)
```javascript
// REST запрос
const response = await fetch('/api/users', {
  headers: { Authorization: `Bearer ${token}` }
});
const users = await response.json();

// Socket.IO подписка
socket.on('message', (message) => {
  setMessages(prev => [...prev, message]);
});
```

### Новый способ (GraphQL)
```javascript
// GraphQL запрос
const { data } = useQuery(GET_USERS);

// GraphQL подписка
useSubscription(MESSAGE_ADDED, {
  variables: { chatId },
  onData: ({ data }) => {
    // Автоматическое обновление кэша
  }
});
```

## Настройка сервера

Для работы с клиентом необходимо реализовать GraphQL сервер со следующей схемой:

1. **HTTP endpoint**: `/graphql` для queries и mutations
2. **WebSocket endpoint**: `/graphql` для subscriptions
3. **Аутентификация**: JWT токен в заголовке Authorization
4. **Загрузка файлов**: поддержка Upload скаляра

Подробная схема описана в файле `docs/graphql-schema.md`.

## Обратная совместимость

Старый хук `useChat` оставлен для плавной миграции. Вы можете:

1. Постепенно переводить компоненты на новый хук
2. Использовать оба хука одновременно
3. Полностью переключиться на GraphQL версию

## Отладка

### Apollo DevTools
1. Установите расширение Apollo Client DevTools
2. Откройте DevTools в браузере
3. Перейдите на вкладку Apollo для просмотра кэша и операций

### Консольные логи
```javascript
// Включение подробных логов Apollo
const client = new ApolloClient({
  // ... конфигурация
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
  },
});
```

## Производительность

### Оптимизации кэша
- Нормализованное кэширование по ID
- Автоматическое обновление связанных данных
- Оптимистичные обновления для лучшего UX

### Подписки
- Автоматическое управление подписками
- Переподключение при потере соединения
- Фильтрация по активному чату

## Безопасность

- JWT токены в заголовках Authorization
- Автоматическая очистка кэша при logout
- Проверка прав доступа на сервере
- Валидация входных данных

## Следующие шаги

1. **Реализация серверной части** согласно схеме в `docs/graphql-schema.md`
2. **Тестирование** всех GraphQL операций
3. **Оптимизация** кэша и подписок
4. **Удаление** старого кода после полной миграции

## Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Используйте Apollo DevTools для отладки
3. Убедитесь, что сервер реализует правильную GraphQL схему
4. Проверьте настройки WebSocket соединения
