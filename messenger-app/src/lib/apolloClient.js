import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Принудительно используем HTTP протокол
const API_URL = (import.meta.env.VITE_API_URL || 'http://10.185.101.19:8080').replace('https://', 'http://');

// HTTP ссылка для queries и mutations
const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

// WebSocket ссылка для subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: API_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/graphql',
  connectionParams: () => {
    const token = localStorage.getItem('token');
    return token ? { authorization: `Bearer ${token}` } : {};
  },
  shouldRetry: (errorOrCloseEvent) => {
    console.log('WebSocket connection error:', errorOrCloseEvent);
    return true;
  },
}));

// Middleware для добавления токена авторизации
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Разделение ссылок для HTTP и WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Создание Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          // Кэширование пользователей по userId
          id: {
            read(_, { variables }) {
              return variables?.userId;
            }
          }
        }
      },
      Chat: {
        fields: {
          // Кэширование чатов
          messages: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            }
          }
        }
      },
      Message: {
        fields: {
          // Кэширование сообщений
          user: {
            merge: true
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default client;
