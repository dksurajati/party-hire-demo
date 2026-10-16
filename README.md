# Party Hire Booking Demo

A concept booking flow for an event and party hire business: pick a date, see live availability, build an order from packages or single items, and confirm instantly with a deposit.

Built with Next.js, React, TypeScript, Tailwind CSS and lucide-react.

## Features

- Availability per item for the chosen date (simulated, weekends are busier)
- Quick-start packages that warn when stock is short
- Running total with delivery, optional setup and a 30% deposit
- Details form with validation and an instant confirmation screen
- Mobile-first layout with a sticky order bar, light and dark mode

## Editing

Items, prices, stock, packages and fees live in `lib/catalog.ts`.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes

This is a front-end demo. Availability is simulated and no bookings, payments or emails are real. A production version would add a database, a payment provider such as Stripe, and confirmation emails.
