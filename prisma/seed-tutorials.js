// prisma/seed-tutorials.js
// Run:  node prisma/seed-tutorials.js
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TUTORIALS = [
  // ----------------------------- ENGLISH -----------------------------
  {
    language: "en",
    category: "Getting started",
    title: "Welcome and first setup",
    description: "Sign in, set up your hotel, and add your first branch.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "3:24",
    sort_order: 0,
  },
  {
    language: "en",
    category: "Rooms",
    title: "Managing rooms and bookings",
    description:
      "See which rooms are free, check guests in, and handle bookings.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "5:12",
    sort_order: 1,
  },
  {
    language: "en",
    category: "Restaurant",
    title: "Restaurant and POS basics",
    description: "Take orders, send them to the kitchen, and print bills.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "4:47",
    sort_order: 2,
  },
  {
    language: "en",
    category: "Staff",
    title: "Adding staff and managing shifts",
    description: "Create staff logins, assign roles, and track open shifts.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "3:58",
    sort_order: 3,
  },
  {
    language: "en",
    category: "Reports",
    title: "Daily reports and closing the day",
    description: "Check sales, expenses, and close the day with confidence.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "4:20",
    sort_order: 4,
  },
  {
    language: "en",
    category: "Help",
    title: "Common issues and quick fixes",
    description: "What to do if a printer, till, or device isn't working.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "2:55",
    sort_order: 5,
  },

  // ----------------------------- PASHTO -----------------------------
  {
    language: "ps",
    category: "پیل کول",
    title: "ښه راغلاست او لومړنی تنظیم",
    description: "ننوځئ، خپل هوټل تنظیم کړئ او لومړنی څانګه اضافه کړئ.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "3:24",
    sort_order: 0,
  },
  {
    language: "ps",
    category: "خونې",
    title: "د خونو او بکنګونو اداره",
    description:
      "وګورئ کومې خونې خالي دي، میلمانه داخله کړئ او بکنګونه اداره کړئ.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "5:12",
    sort_order: 1,
  },
  {
    language: "ps",
    category: "رستورانت",
    title: "د رستورانت او POS بنسټونه",
    description: "سفارشونه واخلئ، پخلنځي ته یې ولېږئ او بیله چاپ کړئ.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "4:47",
    sort_order: 2,
  },
  {
    language: "ps",
    category: "کارکوونکي",
    title: "کارکوونکي اضافه کول او شفټونه اداره کول",
    description: "د کارکوونکو ننوتل جوړ کړئ، رولونه ټاکئ او شفټونه تعقیب کړئ.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "3:58",
    sort_order: 3,
  },
  {
    language: "ps",
    category: "راپورونه",
    title: "ورځني راپورونه او د ورځې پای",
    description: "پلور، لګښتونه وګورئ او په ډاډ سره ورځ پای ته ورسوئ.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "4:20",
    sort_order: 4,
  },
  {
    language: "ps",
    category: "مرسته",
    title: "عامې ستونزې او ګړندي حلونه",
    description: "څه وکړو که چاپګر، صندوق یا وسیله کار نه کوي.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "2:55",
    sort_order: 5,
  },

  // ----------------------------- DARI -------------------------------
  {
    language: "prs",
    category: "شروع به کار",
    title: "خوش آمدید و راه‌اندازی اولیه",
    description:
      "وارد شوید، هوتل خود را تنظیم کنید و اولین شعبه را اضافه کنید.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "3:24",
    sort_order: 0,
  },
  {
    language: "prs",
    category: "اتاق‌ها",
    title: "مدیریت اتاق‌ها و رزروها",
    description:
      "ببینید کدام اتاق‌ها آزادند، مهمانان را وارد کنید و رزروها را مدیریت کنید.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "5:12",
    sort_order: 1,
  },
  {
    language: "prs",
    category: "رستوران",
    title: "اصول رستوران و POS",
    description: "سفارش بگیرید، به آشپزخانه بفرستید و صورتحساب چاپ کنید.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "4:47",
    sort_order: 2,
  },
  {
    language: "prs",
    category: "کارکنان",
    title: "افزودن کارکنان و مدیریت شیفت‌ها",
    description:
      "ورود کارکنان بسازید، نقش‌ها تعیین کنید و شیفت‌ها را پیگیری کنید.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "3:58",
    sort_order: 3,
  },
  {
    language: "prs",
    category: "گزارش‌ها",
    title: "گزارش‌های روزانه و بستن روز",
    description: "فروش، هزینه‌ها را ببینید و با اطمینان روز را ببندید.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "4:20",
    sort_order: 4,
  },
  {
    language: "prs",
    category: "کمک",
    title: "مشکلات رایج و راه‌حل‌های سریع",
    description: "اگر چاپگر، صندوق یا دستگاه کار نمی‌کند چه کنید.",
    youtube_id: "dQw4w9WgXcQ",
    duration: "2:55",
    sort_order: 5,
  },
];

async function main() {
  console.log("Seeding tutorials…");
  await prisma.tutorials.deleteMany({});
  await prisma.tutorials.createMany({ data: TUTORIALS });
  const count = await prisma.tutorials.count();
  console.log(`✅ Done. ${count} tutorial rows inserted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
