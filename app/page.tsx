"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Minus,
  PartyPopper,
  Plus,
  RotateCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  CATALOG,
  DELIVERY_FEE,
  DEPOSIT_RATE,
  ITEMS,
  PACKAGES,
  SETUP_FEE,
  availableOn,
  formatDate,
  money,
} from "@/lib/catalog";

type Step = "order" | "details" | "done";
type Quantities = Record<string, number>;

function minBookingDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [date, setDate] = useState("");
  const [qty, setQty] = useState<Quantities>({});
  const [tab, setTab] = useState(CATALOG[0].name);
  const [setup, setSetup] = useState(false);
  const [notice, setNotice] = useState("");
  const [step, setStep] = useState<Step>("order");
  const [form, setForm] = useState({ name: "", email: "", phone: "", suburb: "" });
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<{ ref: string; email: string } | null>(null);
  const [minDate] = useState(minBookingDate);

  const clamp = (d: string, id: string, n: number) =>
    Math.max(0, Math.min(n, availableOn(d, id)));

  const withQty = (current: Quantities, d: string, id: string, n: number) => {
    const next = { ...current };
    const value = clamp(d, id, n);
    if (value === 0) delete next[id];
    else next[id] = value;
    return next;
  };

  const lines = useMemo(
    () =>
      Object.entries(qty).map(([id, q]) => ({
        id,
        name: ITEMS[id].name,
        qty: q,
        cost: ITEMS[id].price * q,
      })),
    [qty],
  );

  const totals = useMemo(() => {
    const sub = lines.reduce((s, l) => s + l.cost, 0);
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const delivery = sub > 0 ? DELIVERY_FEE : 0;
    const setupFee = sub > 0 && setup ? SETUP_FEE : 0;
    const total = sub + delivery + setupFee;
    const deposit = Math.round(total * DEPOSIT_RATE * 100) / 100;
    return { sub, count, delivery, total, deposit };
  }, [lines, setup]);

  const hasItems = totals.count > 0;

  function changeDate(d: string) {
    setDate(d);
    const reduced: string[] = [];
    let next: Quantities = {};
    for (const [id, q] of Object.entries(qty)) {
      next = withQty(next, d, id, q);
      if ((next[id] ?? 0) < q) reduced.push(ITEMS[id].name);
    }
    setQty(next);
    setNotice(
      reduced.length
        ? `Some items have less stock on this date, so we adjusted: ${reduced.join(", ")}.`
        : "",
    );
  }

  function addPackage(items: Record<string, number>) {
    const short: string[] = [];
    let next: Quantities = {};
    for (const [id, q] of Object.entries(items)) {
      next = withQty(next, date, id, q);
      if ((next[id] ?? 0) < q) short.push(ITEMS[id].name);
    }
    setQty(next);
    setNotice(
      short.length
        ? `Package added. Not enough stock on this date for: ${short.join(", ")}. We've added what's available.`
        : "",
    );
  }

  function confirm() {
    const { name, email, phone } = form;
    let err = "";
    if (!name.trim()) err = "Please enter your name.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      err = "Please enter a valid email address.";
    else if (phone.replace(/\D/g, "").length < 8) err = "Please enter a phone number.";
    setError(err);
    if (err) return;
    setBooking({
      ref: "PH-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      email: email.trim(),
    });
    setStep("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setDate("");
    setQty({});
    setTab(CATALOG[0].name);
    setSetup(false);
    setNotice("");
    setForm({ name: "", email: "", phone: "", suburb: "" });
    setError("");
    setBooking(null);
    setStep("order");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const category = CATALOG.find((c) => c.name === tab) ?? CATALOG[0];
  const card = "rounded-2xl border border-line bg-surface p-5";
  const input =
    "w-full rounded-xl border border-line bg-background px-3 py-3 text-foreground outline-none focus:border-accent";

  // Confirmation screen
  if (step === "done" && booking) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <section className={`${card} text-center`}>
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok text-white">
            <Check className="size-8" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold">You&apos;re booked!</h1>
          <p className="mt-2 text-muted">
            Your gear is reserved. Nobody else can book these items for your date.
          </p>
          <p className="mt-6 text-sm text-muted">Booking reference</p>
          <p className="font-mono text-xl font-bold text-accent">{booking.ref}</p>

          <div className="mx-auto mt-6 space-y-2 text-left text-sm">
            <Row label="Date" value={formatDate(date)} />
            {lines.map((l) => (
              <Row key={l.id} label={`${l.qty} × ${l.name}`} value={money(l.cost)} />
            ))}
            <Row label="Deposit paid" value={money(totals.deposit)} strong />
            <Row
              label="Balance due 3 days before"
              value={money(Math.round((totals.total - totals.deposit) * 100) / 100)}
            />
          </div>

          <p className="mt-6 text-sm text-muted">
            A confirmation email has been sent to {booking.email}. (In this demo nothing is
            actually sent or charged.)
          </p>
          <button
            onClick={restart}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 font-semibold hover:border-accent hover:text-accent"
          >
            <RotateCcw className="size-4" /> Start a new booking
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="pb-28 lg:pb-10">
      <header className="mx-auto max-w-6xl px-4 pt-8 pb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold tracking-wide text-accent uppercase">
          <PartyPopper className="size-3.5" /> Concept demo
        </span>
        <h1 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">
          Book your party hire in one go
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Pick your date, see what&apos;s actually available, build your order and lock it in
          with a deposit. No waiting for emails to confirm.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-5">
          {/* Step 1: date */}
          <section className={card}>
            <StepTitle n={1}>When is your event?</StepTitle>
            <label htmlFor="date" className="mb-1.5 block text-sm font-semibold">
              Event date
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
              <input
                id="date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => changeDate(e.target.value)}
                className={`${input} pl-11`}
                suppressHydrationWarning
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              Availability updates live for the date you choose.
            </p>
          </section>

          {/* Step 2: items */}
          <section className={card}>
            <StepTitle n={2}>Choose your gear</StepTitle>
            <p className="text-sm text-muted">Quick start with a package, then adjust:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PACKAGES.map((p) => (
                <button
                  key={p.name}
                  disabled={!date}
                  onClick={() => addPackage(p.items)}
                  className="rounded-full border border-line bg-background px-4 py-2 text-sm hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:text-foreground"
                >
                  {p.name} · {p.guests} guests
                </button>
              ))}
            </div>

            {notice && (
              <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2.5 text-sm">{notice}</p>
            )}

            <div role="tablist" className="mt-5 mb-3 flex gap-2 overflow-x-auto pb-1">
              {CATALOG.map((c) => (
                <button
                  key={c.name}
                  role="tab"
                  aria-selected={c.name === tab}
                  onClick={() => setTab(c.name)}
                  className={`rounded-full border px-4 py-2 text-sm whitespace-nowrap ${
                    c.name === tab
                      ? "border-foreground bg-foreground text-background"
                      : "border-line text-muted"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {category.items.map((item) => {
                const avail = availableOn(date, item.id);
                const q = qty[item.id] ?? 0;
                const Icon = item.icon;

                let status = `${avail} available`;
                let tone = "text-ok font-semibold";
                if (!date) {
                  status = "Pick a date to check availability";
                  tone = "text-muted";
                } else if (avail === 0) {
                  status = "Fully booked on this date";
                  tone = "text-bad font-semibold";
                } else if (avail <= Math.max(2, item.stock * 0.2)) {
                  status = `Only ${avail} left on this date`;
                  tone = "text-warn font-semibold";
                }

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-xl border border-line p-3"
                  >
                    <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted">{money(item.price)} each</p>
                      <p className={`text-xs ${tone}`}>{status}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StepButton
                        label={`Remove one ${item.name}`}
                        disabled={q === 0}
                        onClick={() => setQty(withQty(qty, date, item.id, q - 1))}
                      >
                        <Minus className="size-4" />
                      </StepButton>
                      <span className="min-w-6 text-center font-bold">{q}</span>
                      <StepButton
                        label={`Add one ${item.name}`}
                        disabled={!date || q >= avail}
                        onClick={() => setQty(withQty(qty, date, item.id, q + 1))}
                      >
                        <Plus className="size-4" />
                      </StepButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 3: details */}
          {step === "details" && (
            <section id="details" className={card}>
              <StepTitle n={3}>Your details</StepTitle>
              <div className="grid gap-3">
                {(
                  [
                    ["name", "Full name", "text", "name", ""],
                    ["email", "Email", "email", "email", ""],
                    ["phone", "Phone", "tel", "tel", ""],
                    ["suburb", "Delivery suburb", "text", "address-level2", "e.g. Subiaco"],
                  ] as const
                ).map(([key, label, type, auto, placeholder]) => (
                  <div key={key}>
                    <label htmlFor={key} className="mb-1.5 block text-sm font-semibold">
                      {label}
                    </label>
                    <input
                      id={key}
                      type={type}
                      autoComplete={auto}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className={input}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 min-h-5 text-sm text-bad">{error}</p>
              <button
                onClick={confirm}
                className="mt-1 w-full rounded-xl bg-accent px-4 py-3.5 font-bold text-white"
              >
                Pay deposit &amp; confirm
              </button>
              <button
                onClick={() => {
                  setStep("order");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 font-semibold"
              >
                <ArrowLeft className="size-4" /> Back to my order
              </button>
            </section>
          )}
        </div>

        {/* Summary */}
        <aside id="summary" className={`${card} lg:sticky lg:top-4`}>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="size-5" /> Your order
          </h2>
          <p className="text-sm text-muted">{date ? formatDate(date) : "No date selected yet"}</p>

          {hasItems ? (
            <>
              <div className="my-3 space-y-1.5 text-sm">
                {lines.map((l) => (
                  <Row key={l.id} label={`${l.qty} × ${l.name}`} value={money(l.cost)} />
                ))}
              </div>
              <div className="space-y-1 border-t border-line pt-3 text-sm">
                <Row label="Items" value={money(totals.sub)} />
                <Row
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="size-4" /> Delivery
                    </span>
                  }
                  value={money(totals.delivery)}
                />
                <label className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    checked={setup}
                    onChange={(e) => setSetup(e.target.checked)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  Setup &amp; pack-down (+{money(SETUP_FEE)})
                </label>
                <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>{money(totals.total)}</span>
                </div>
                <div className="flex justify-between font-semibold text-accent">
                  <span>Deposit today (30%)</span>
                  <span>{money(totals.deposit)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="my-3 text-sm text-muted">Add items to see your total.</p>
          )}

          <button
            disabled={!hasItems || !date}
            onClick={() => {
              setStep("details");
              setTimeout(
                () =>
                  document
                    .getElementById("details")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                50,
              );
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Continue <ArrowRight className="size-4" />
          </button>
        </aside>
      </main>

      <p className="mx-auto mt-6 max-w-6xl px-4 text-xs text-muted">
        Concept demo with sample prices and simulated availability. No real bookings or
        payments are made.
      </p>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 lg:hidden">
        <div>
          <p className="font-bold">{money(totals.total)}</p>
          <p className="text-xs text-muted">
            {hasItems
              ? `${totals.count} items · ${money(totals.deposit)} deposit`
              : "No items yet"}
          </p>
        </div>
        <button
          onClick={() =>
            document
              .getElementById("summary")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="rounded-xl bg-accent px-5 py-3 font-bold text-white"
        >
          View order
        </button>
      </div>
    </div>
  );
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-lg font-bold">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm text-white">
        {n}
      </span>
      {children}
    </h2>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-line bg-background disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: React.ReactNode;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}
