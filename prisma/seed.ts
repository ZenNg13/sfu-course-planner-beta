import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
  {
    code: 'CMPT 120',
    name: 'Introduction to Computing Science and Programming I',
    prerequisites: [],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 125',
    name: 'Introduction to Computing Science and Programming II',
    prerequisites: ['CMPT 120'],
    prerequisitesOr: [],
  },
  {
    code: 'MACM 101',
    name: 'Discrete Mathematics I',
    prerequisites: [],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 225',
    name: 'Data Structures and Programming',
    prerequisites: ['CMPT 125', 'MACM 101'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 295',
    name: 'Introduction to Computer Systems',
    prerequisites: ['MACM 101'],
    // THIS IS THE COMPLEX ONE: (CMPT 125 OR 128) AND (CMPT 127 OR 129)
    // We represent "OR" groups as strings joined by "|"
    prerequisitesOr: ['CMPT 125|CMPT 128', 'CMPT 127|CMPT 129'], 
  },
];

async function main() {
  console.log('Start seeding...');
  for (const course of courses) {
    // "upsert" means: If it exists, update it. If not, create it.
    const result = await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: course,
    });
    console.log(`Created course: ${result.code}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });