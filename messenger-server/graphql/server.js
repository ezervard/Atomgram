const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');

const typeDefs = require('./schema');
const { resolvers } = require('./resolvers');

const pubsub = new PubSub();

const createGraphQLServer = async (app, httpServer) => {
  // Создаем схему
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
      ...resolvers,
      Subscription: {
        ...resolvers.Subscription
      }
    }
  });

  // Настраиваем WebSocket сервер для subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx) => {
      // Аутентификация для WebSocket соединений
      const authHeader = ctx.connectionParams?.authorization;
      if (authHeader) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
          const token = authHeader.replace('Bearer ', '');
          const decoded = jwt.verify(token, JWT_SECRET);
          
          return {
            user: decoded,
            pubsub
          };
        } catch (error) {
          console.error('WebSocket auth error:', error);
          throw new Error('Authentication failed');
        }
      }
      
      return {
        pubsub
      };
    },
    onConnect: async (ctx) => {
      console.log('GraphQL WebSocket connection established');
    },
    onDisconnect: (ctx, code, reason) => {
      console.log('GraphQL WebSocket disconnected:', code, reason);
    },
  }, wsServer);

  // Создаем Apollo Server
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      return {
        req,
        pubsub
      };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    introspection: true,
    playground: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  console.log(`GraphQL Server ready at http://localhost:${process.env.PORT || 8080}${server.graphqlPath}`);
  console.log(`GraphQL Subscriptions ready at ws://localhost:${process.env.PORT || 8080}/graphql`);

  return server;
};

module.exports = { createGraphQLServer, pubsub };