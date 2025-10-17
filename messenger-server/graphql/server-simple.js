const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { PubSub } = require('graphql-subscriptions');

const typeDefs = require('./schema');
const { resolvers } = require('./resolvers');

const pubsub = new PubSub();

const createGraphQLServer = async (app, httpServer, io) => {
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

  // Создаем Apollo Server (без WebSocket subscriptions пока)
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      return {
        req,
        pubsub,
        io
      };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    introspection: true,
    playground: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  console.log(`GraphQL Server ready at http://localhost:${process.env.PORT || 8080}${server.graphqlPath}`);
  console.log(`Note: WebSocket subscriptions disabled for now`);

  return server;
};

module.exports = { createGraphQLServer, pubsub };
