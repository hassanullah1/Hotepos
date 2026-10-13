// lib/pageText.js
// Copy for the landing page, keyed by language code.
// Add "ps" (Pashto) and "prs" (Dari) objects the same shape when ready —
// both components fall back to English for any key that's missing.

export const pageText = {
  en: {
    loading: "Loading…",

    hero: {
      title: "Run every hotel operation from one screen",
      subtitle:
        "Melmah brings bookings, food orders, receipts and daily checklists into a single system built for how hotel teams actually work.",
      primaryCta: "Register your hotel",
      secondaryCta: "See how it works",
      statHotelsLabel: "Hotels onboard",
      statCitiesLabel: "Cities",
      statOrdersLabel: "Orders processed",
      appGreeting: "Front desk",
      appHotelName: "Kabul Serena",
      menuRooms: "Rooms",
      menuChecklist: "Checklist",
      menuFood: "Room service",
      menuReceipts: "Receipts",
    },

    showcase: {
      appEyebrow: "Hotel menu",
      appTitle: "Everything, in one app",
      title: "One app, the whole front desk",
      subtitle:
        "Staff open a single app instead of switching between a booking ledger, a kitchen notebook and a stack of receipts. What they tap on their phone is what happens on the floor.",
      menu: {
        rooms: "Rooms & bookings",
        checklist: "Daily checklist",
        food: "Room service",
        receipts: "Receipts",
      },
      menuDesc: {
        rooms: "Track availability and check-ins in real time.",
        checklist: "Housekeeping and maintenance tasks, assigned and tracked.",
        food: "Food orders sent straight to the kitchen, no paper slips.",
        receipts: "Every charge itemized and ready to print or share.",
      },
    },
  },

  // Stub — copy the "en" shape above and translate each value.
  ps: {
    loading: "Loading…",
    hero: {},
    showcase: {},
  },

  // Stub — copy the "en" shape above and translate each value.
  prs: {
    loading: "Loading…",
    hero: {},
    showcase: {},
  },
};
