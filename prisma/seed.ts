import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
  // --- Level 100: The Foundation ---
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
    code: 'CMPT 127',
    name: 'Computing Laboratory',
    prerequisites: [], // Co-requisite with 125
    prerequisitesOr: [],
  },
  {
    code: 'MACM 101',
    name: 'Discrete Mathematics I',
    prerequisites: [],
    prerequisitesOr: [],
  },
  {
    code: 'MATH 151',
    name: 'Calculus I',
    prerequisites: [],
    prerequisitesOr: [],
  },
  {
    code: 'MATH 152',
    name: 'Calculus II',
    prerequisites: ['MATH 151'],
    prerequisitesOr: [],
  },

  // --- Level 200: The Core ---
  {
    code: 'CMPT 225',
    name: 'Data Structures and Programming',
    prerequisites: ['CMPT 125', 'MACM 101'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 276',
    name: 'Introduction to Software Engineering',
    prerequisites: ['CMPT 225'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 295',
    name: 'Introduction to Computer Systems',
    prerequisites: ['CMPT 125', 'MACM 101'],
    // Also requires one of CMPT 127 or 135, usually 127 for majors
    prerequisitesOr: ['CMPT 127|CMPT 135'],
  },
  {
    code: 'CMPT 272',
    name: 'Web I - Client-side Development',
    prerequisites: ['CMPT 125'], 
    prerequisitesOr: [],
  },
  {
    code: 'MACM 201',
    name: 'Discrete Mathematics II',
    prerequisites: ['MACM 101'],
    prerequisitesOr: [],
  },

  // --- Level 300: Advanced Concepts ---
  {
    code: 'CMPT 300',
    name: 'Operating Systems I',
    prerequisites: ['CMPT 225'],
    // Requires CMPT 295 OR ENSC 254
    prerequisitesOr: ['CMPT 295|ENSC 254'],
  },
  {
    code: 'CMPT 307',
    name: 'Data Structures and Algorithms',
    prerequisites: ['CMPT 225', 'MACM 201'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 310',
    name: 'Introduction to Artificial Intelligence',
    prerequisites: ['CMPT 225'],
    // Requires STAT 270 or 271
    prerequisitesOr: ['STAT 270|STAT 271'],
  },
  {
    code: 'CMPT 354',
    name: 'Database Systems I',
    prerequisites: ['CMPT 225', 'MACM 101'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 371',
    name: 'Data Communications and Networking',
    prerequisites: ['CMPT 225', 'MATH 151'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 372',
    name: 'Web II - Server-side Development',
    prerequisites: ['CMPT 225', 'CMPT 272'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 373',
    name: 'Software Development Methods',
    prerequisites: ['CMPT 276', 'CMPT 225'],
    prerequisitesOr: [],
  },

  // --- Level 400: Senior Systems (Your Target Courses) ---
  {
    code: 'CMPT 431',
    name: 'Distributed Systems',
    prerequisites: ['CMPT 371'],
    prerequisitesOr: ['CMPT 300|CMPT 201'],
  },
  {
    code: 'CMPT 454',
    name: 'Database Systems II',
    prerequisites: ['CMPT 354', 'CMPT 300'],
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 473',
    name: 'Software Testing, Reliability and Security',
    prerequisites: ['CMPT 276', 'CMPT 373'], 
    prerequisitesOr: [],
  },
  {
    code: 'CMPT 474',
    name: 'Web Systems Architecture',
    prerequisites: ['CMPT 372'], 
    prerequisitesOr: [],
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