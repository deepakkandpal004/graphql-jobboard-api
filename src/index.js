import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import depthLimit from 'graphql-depth-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { createLoaders } from './dataloaders.js';
import { getUserFromRequest } from './auth.js';

const prisma = new PrismaClient();
const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(7)], // don't let queries nest forever
});
await server.start();

app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({
      prisma,
      loaders: createLoaders(prisma),
      user: await getUserFromRequest(req, prisma),
    }),
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GraphQL running at http://localhost:${PORT}/graphql`);
});
