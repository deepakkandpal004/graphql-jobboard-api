import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const demo = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  });

  const acme = await prisma.company.create({
    data: {
      name: 'Acme Systems',
      website: 'https://acme.example.com',
      location: 'Mumbai',
      jobs: {
        create: [
          {
            title: 'MERN Stack Developer',
            description: 'Build full-stack features with React + Node.',
            location: 'Mumbai',
            minExp: 0,
            maxExp: 1,
          },
          {
            title: 'Frontend Developer',
            description: 'React + TypeScript UI work.',
            location: 'Remote',
            remote: true,
            minExp: 0,
            maxExp: 2,
          },
        ],
      },
    },
  });

  const globex = await prisma.company.create({
    data: {
      name: 'Globex Labs',
      website: 'https://globex.example.com',
      location: 'Bangalore',
      jobs: {
        create: [
          {
            title: 'Backend Developer',
            description: 'Node.js APIs and Postgres.',
            location: 'Bangalore',
            minExp: 1,
            maxExp: 3,
          },
        ],
      },
    },
  });

  const firstJob = await prisma.job.findFirst({ where: { companyId: acme.id } });
  await prisma.application.create({
    data: { jobId: firstJob.id, userId: demo.id, note: 'Applied via hirist' },
  });

  console.log('done. login with demo@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
