import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';
import { encodeCursor, decodeCursor } from './pagination.js';
import { hashPassword, verifyPassword, signToken } from './auth.js';

function requireUser(user) {
  if (!user) {
    throw new GraphQLError('You must be logged in to do that', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString()),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

export const resolvers = {
  DateTime,
  Query: {
    jobs: (_, { location, remote }, { prisma }) =>
      prisma.job.findMany({
        where: {
          ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
          ...(remote !== undefined ? { remote } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),

    job: (_, { id }, { prisma }) =>
      prisma.job.findUnique({ where: { id }, include: { company: true } }),

    companies: (_, __, { prisma }) => prisma.company.findMany({ include: { jobs: true } }),

    applications: (_, { status }, { prisma, user }) => {
      requireUser(user);
      return prisma.application.findMany({
        where: { userId: user.id, ...(status ? { status } : {}) },
        include: { job: { include: { company: true } } },
        orderBy: { createdAt: 'desc' },
      });
    },

    me: (_, __, { user }) => user,

    jobsConnection: async (_, { first = 10, after }, { prisma }) => {
      const limit = Math.min(Math.max(first, 1), 50);
      let cursorFilter = {};
      if (after) {
        const { createdAt, id } = decodeCursor(after);
        cursorFilter = {
          OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
        };
      }
      const rows = await prisma.job.findMany({
        where: cursorFilter,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1, 
      });
      const hasNextPage = rows.length > limit;
      const nodes = hasNextPage ? rows.slice(0, limit) : rows;
      const edges = nodes.map((node) => ({ cursor: encodeCursor(node), node }));
      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length ? edges[edges.length - 1].cursor : null,
        },
        totalCount: await prisma.job.count(),
      };
    },
  },

  Mutation: {
    signup: async (_, { email, password, name }, { prisma }) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new GraphQLError('Email already registered', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const user = await prisma.user.create({
        data: { email, passwordHash: await hashPassword(password), name },
      });
      return { token: signToken(user), user };
    },

    login: async (_, { email, password }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return { token: signToken(user), user };
    },

    createCompany: (_, { name, website, location }, { prisma }) =>
      prisma.company.create({ data: { name, website, location } }),

    createJob: (_, { input }, { prisma }) =>
      prisma.job.create({ data: input, include: { company: true } }),

    createApplication: (_, { jobId, note }, { prisma, user }) => {
      requireUser(user);
      return prisma.application.create({
        data: { jobId, note, userId: user.id },
        include: { job: { include: { company: true } } },
      });
    },

    updateApplicationStatus: async (_, { id, status }, { prisma, user }) => {
      requireUser(user);
      const app = await prisma.application.findUnique({ where: { id } });
      if (!app || app.userId !== user.id) {
        throw new GraphQLError('Application not found', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return prisma.application.update({
        where: { id },
        data: { status },
        include: { job: { include: { company: true } } },
      });
    },
  },

  Job: {
    company: (parent, _, { loaders }) =>
      parent.company ?? loaders.companyById.load(parent.companyId),
    applications: (parent, _, { prisma }) =>
      prisma.application.findMany({ where: { jobId: parent.id } }),
  },
  Company: {
    jobs: (parent, _, { prisma }) =>
      parent.jobs ?? prisma.job.findMany({ where: { companyId: parent.id } }),
  },
  Application: {
    job: (parent, _, { prisma }) =>
      parent.job ?? prisma.job.findUnique({ where: { id: parent.jobId }, include: { company: true } }),
  },
};
