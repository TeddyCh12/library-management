import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

// Seeding is an admin operation, so it uses the direct (unpooled) connection,
// same as the rest of the Prisma CLI.
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

type SeedBook = {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  description: string;
  totalCopies?: number;
};

const books: SeedBook[] = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    genre: "Classic Fiction",
    publishedYear: 1960,
    description:
      "Scout Finch grows up in Depression-era Alabama as her father, lawyer Atticus Finch, defends a Black man falsely accused of a terrible crime.",
    totalCopies: 3,
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    genre: "Dystopian",
    publishedYear: 1949,
    description:
      "Winston Smith rewrites history for the Ministry of Truth in a totalitarian state where Big Brother watches everything — until he dares to think for himself.",
    totalCopies: 3,
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    genre: "Classic Fiction",
    publishedYear: 1925,
    description:
      "Nick Carraway is drawn into the glittering, doomed world of his mysterious neighbor Jay Gatsby and Gatsby's obsession with Daisy Buchanan.",
    totalCopies: 2,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    genre: "Romance",
    publishedYear: 1813,
    description:
      "Elizabeth Bennet spars with the proud Mr. Darcy in a sharp comedy of manners about love, class, and first impressions in Regency England.",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    genre: "Fantasy",
    publishedYear: 1937,
    description:
      "Bilbo Baggins, a comfort-loving hobbit, is swept into a quest with thirteen dwarves to reclaim their mountain home from the dragon Smaug.",
    totalCopies: 2,
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441172719",
    genre: "Science Fiction",
    publishedYear: 1965,
    description:
      "Paul Atreides is thrust into the deadly politics of the desert planet Arrakis, sole source of the most valuable substance in the universe.",
    totalCopies: 2,
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "9780316769488",
    genre: "Classic Fiction",
    publishedYear: 1951,
    description:
      "Expelled from prep school, sixteen-year-old Holden Caulfield wanders New York City for three days, railing against the phoniness of the adult world.",
  },
  {
    title: "Brave New World",
    author: "Aldous Huxley",
    isbn: "9780060850524",
    genre: "Dystopian",
    publishedYear: 1932,
    description:
      "In a genetically engineered World State where happiness is manufactured and dissent is obsolete, one outsider questions the cost of comfort.",
  },
  {
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    isbn: "9780060883287",
    genre: "Magical Realism",
    publishedYear: 1967,
    description:
      "The rise and fall of the Buendía family unfolds across seven generations in the mythical town of Macondo.",
  },
  {
    title: "Beloved",
    author: "Toni Morrison",
    isbn: "9781400033416",
    genre: "Historical Fiction",
    publishedYear: 1987,
    description:
      "Sethe, an escaped slave in post-Civil War Ohio, is haunted by the ghost of the daughter she lost and the brutal past she cannot escape.",
  },
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    isbn: "9780756404741",
    genre: "Fantasy",
    publishedYear: 2007,
    description:
      "Kvothe — magician, musician, and notorious legend — recounts how an orphaned trouper became the most infamous wizard his world has ever seen.",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "9780593135204",
    genre: "Science Fiction",
    publishedYear: 2021,
    description:
      "Ryland Grace wakes alone on a spaceship with no memory of who he is — and discovers he is humanity's last hope against an extinction-level threat.",
    totalCopies: 2,
  },
  {
    title: "Educated",
    author: "Tara Westover",
    isbn: "9780399590504",
    genre: "Memoir",
    publishedYear: 2018,
    description:
      "Raised by survivalists in the Idaho mountains and kept out of school, Tara Westover fights her way to a PhD from Cambridge — at the cost of her family.",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    genre: "History",
    publishedYear: 2015,
    description:
      "A sweeping account of how Homo sapiens came to dominate the Earth, from the cognitive revolution to money, empires, and the age of algorithms.",
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    isbn: "9781250301697",
    genre: "Thriller",
    publishedYear: 2019,
    description:
      "Alicia Berenson shoots her husband and never speaks again; the psychotherapist determined to make her talk uncovers a truth he never saw coming.",
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    isbn: "9780735219090",
    genre: "Mystery",
    publishedYear: 2018,
    description:
      "Kya, the abandoned 'Marsh Girl' of the North Carolina coast, becomes the prime suspect when a local man is found dead in the swamp she calls home.",
  },
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    isbn: "9780525559474",
    genre: "Fiction",
    publishedYear: 2020,
    description:
      "Between life and death, Nora Seed finds a library of books containing every life she could have lived — and a chance to choose differently.",
  },
  {
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    isbn: "9780593318171",
    genre: "Literary Fiction",
    publishedYear: 2021,
    description:
      "Klara, an Artificial Friend with keen powers of observation, watches the world from a store window while hoping a customer will choose her.",
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    genre: "Science",
    publishedYear: 1988,
    description:
      "Stephen Hawking's landmark exploration of the universe's biggest questions: the Big Bang, black holes, and the nature of time itself.",
  },
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    isbn: "9781594631931",
    genre: "Historical Fiction",
    publishedYear: 2003,
    description:
      "Amir, haunted by his betrayal of his childhood friend Hassan in Kabul, returns to Taliban-ruled Afghanistan seeking redemption.",
  },
  {
    title: "Circe",
    author: "Madeline Miller",
    isbn: "9780316556347",
    genre: "Fantasy",
    publishedYear: 2018,
    description:
      "Banished to a deserted island, the witch Circe hones her craft and crosses paths with the most famous figures of Greek mythology.",
  },
];

const demoUsers = [
  {
    name: "Demo Member",
    email: "demo.member@example.com",
    role: "MEMBER",
  },
  {
    name: "Demo Librarian",
    email: "demo.librarian@example.com",
    role: "LIBRARIAN",
  },
] as const;

async function main() {
  for (const book of books) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: {
        ...book,
        coverUrl: `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`,
      },
    });
  }
  console.log(`Seeded ${books.length} books.`);

  // Hash the demo password at seed time; plaintext is never stored.
  const passwordHash = await bcrypt.hash("demo1234", 10);
  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role, passwordHash },
      create: { ...user, passwordHash },
    });
  }
  console.log(`Seeded ${demoUsers.length} demo users.`);

  await seedDemoLoans();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY_MS);
}

// Demo loans so the loans page and dashboard have data to show. Only created
// when the demo member has no loans at all, so reruns stay idempotent.
async function seedDemoLoans() {
  const member = await prisma.user.findUniqueOrThrow({
    where: { email: "demo.member@example.com" },
  });

  const existingLoans = await prisma.loan.count({
    where: { userId: member.id },
  });
  if (existingLoans > 0) {
    console.log("Demo member already has loans — skipping demo loans.");
    return;
  }

  const dune = await prisma.book.findUniqueOrThrow({
    where: { isbn: "9780441172719" },
  });
  const hobbit = await prisma.book.findUniqueOrThrow({
    where: { isbn: "9780547928227" },
  });
  const nineteenEightyFour = await prisma.book.findUniqueOrThrow({
    where: { isbn: "9780451524935" },
  });

  await prisma.loan.createMany({
    data: [
      {
        bookId: dune.id,
        userId: member.id,
        status: "ACTIVE",
        borrowedAt: daysFromNow(-20),
        dueAt: daysFromNow(-6), // overdue by 6 days
      },
      {
        bookId: hobbit.id,
        userId: member.id,
        status: "ACTIVE",
        borrowedAt: daysFromNow(-3),
        dueAt: daysFromNow(11),
      },
      {
        bookId: nineteenEightyFour.id,
        userId: member.id,
        status: "RETURNED",
        borrowedAt: daysFromNow(-30),
        dueAt: daysFromNow(-16),
        returnedAt: daysFromNow(-16),
      },
    ],
  });
  console.log("Seeded 3 demo loans.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
