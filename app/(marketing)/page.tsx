import Link from 'next/link';
import {
  UtensilsCrossed,
  Zap,
  Bell,
  ClipboardList,
  Vote,
  MessageSquarePlus,
  BatteryCharging,
  CalendarClock,
  ShieldCheck,
  ArrowRight,
  Clock,
  Search,
  CheckCircle2,
  Users,
  Building2,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

const DEMO_PASSWORD = 'Demo@1234';

export default function LandingPage() {
  return (
    <div>
      <Nav />
      <Hero />
      <Problem />
      <HowItWorks />
      <CafeteriaFeatures />
      <ChargingFeatures />
      <Benefits />
      <PlatformOverview />
      <Testimonials />
      <CtaDemo />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 font-display text-sm text-white">
            W
          </div>
          <span className="font-display text-lg text-ink-900">Workplace</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink-500 md:flex">
          <a href="#how-it-works" className="hover:text-ink-900">How it works</a>
          <a href="#features" className="hover:text-ink-900">Features</a>
          <a href="#demo" className="hover:text-ink-900">Demo</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 sm:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Built for office campuses, not food delivery
          </span>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] text-ink-900 sm:text-5xl">
            Your workplace,
            <br />
            <span className="italic">without the wait.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-500">
            Check today's menu, order before you leave your desk, and reserve
            your EV charging slot in advance, all from one campus platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-medium text-white hover:bg-ink-700"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-medium text-ink-900 hover:bg-ink-50"
            >
              Explore Demo
            </a>
          </div>
          <p className="mt-6 text-xs text-ink-300">
            Developed as a prototype for office-campus services.
          </p>
        </div>

        {/* Signature visual: claim-ticket motif showing the core value prop */}
        <div className="relative mx-auto w-full max-w-sm animate-ticket-in">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-100 via-transparent to-teal-100" aria-hidden="true" />
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
            <div className="h-1.5 bg-amber-400" />
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Cyber Café · Order #1042</p>
                <p className="mt-1 font-display text-lg text-ink-900">Preparing your food</p>
                <p className="text-sm text-ink-400">Estimated pickup: 1:15 PM</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 px-5 pb-5">
              {['Placed', 'Accepted', 'Preparing', 'Ready'].map((step, i) => (
                <div key={step} className="flex flex-1 items-center gap-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full ${i < 3 ? 'bg-amber-400' : 'bg-ink-100'}`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 ml-8 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
            <div className="h-1.5 bg-teal-400" />
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-400">EV Charging · Charger A2</p>
                <p className="mt-1 font-display text-lg text-ink-900">Reservation confirmed</p>
                <p className="text-sm text-ink-400">Tomorrow, 2:00 – 3:00 PM · ₹80 paid</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-500">
                <BatteryCharging className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const stats = [
    {
      icon: Clock,
      title: '20–30 minutes lost',
      body: 'Employees regularly lose half their lunch break walking between counters and waiting for food to be prepared.',
    },
    {
      icon: Search,
      title: 'No visibility before you go',
      body: 'There is no way to check what is available, or whether it has already sold out, before leaving your desk.',
    },
    {
      icon: BatteryCharging,
      title: 'EV chargers, first-come only',
      body: 'Charging apps show live status but offer no way to reserve a slot ahead of time, so you wait anyway.',
    },
  ];
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-ink-900">
            The cafeteria queue is a familiar campus problem.
          </h2>
          <p className="mt-3 text-ink-500">
            Cafeteria owners field the same "what's available today?" question all shift long, while
            employees burn valuable working time finding out the hard way.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.title} className="rounded-2xl border border-line p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-lg text-ink-900">{s.title}</p>
              <p className="mt-1.5 text-sm text-ink-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const foodSteps = [
    { title: 'Check the live menu', body: "See what's available and how long it takes, right from your desk." },
    { title: 'Order & pick a time', body: 'Add items to your cart and choose exactly when you\'ll collect it.' },
    { title: 'Keep working', body: 'The cafeteria accepts your order and starts preparing it in the background.' },
    { title: 'Skip the queue', body: "Get notified the moment it's ready, then walk over and collect it." },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-3xl text-ink-900">How it works</h2>
      <p className="mt-2 max-w-xl text-ink-500">
        The same simple loop powers both food ordering and EV charging: check availability, book ahead,
        get on with your day, arrive right on time.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {foodSteps.map((step, i) => (
          <div key={step.title} className="relative rounded-2xl border border-line bg-white p-6">
            <span className="font-display text-3xl text-amber-300">{String(i + 1).padStart(2, '0')}</span>
            <p className="mt-3 font-medium text-ink-900">{step.title}</p>
            <p className="mt-1.5 text-sm text-ink-400">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureRow({
  icon: Icon,
  eyebrow,
  title,
  body,
  features,
  accent,
  reverse,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  body: string;
  features: { icon: React.ElementType; label: string }[];
  accent: 'amber' | 'teal';
  reverse?: boolean;
}) {
  const accentBg = accent === 'amber' ? 'bg-amber-50 text-amber-500' : 'bg-teal-50 text-teal-500';
  const accentBar = accent === 'amber' ? 'bg-amber-400' : 'bg-teal-400';
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accentBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-ink-400">{eyebrow}</p>
        <h3 className="mt-1 font-display text-2xl text-ink-900">{title}</h3>
        <p className="mt-2 text-ink-500">{body}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className={`h-1.5 ${accentBar}`} />
        <ul className="divide-y divide-line">
          {features.map((f) => (
            <li key={f.label} className="flex items-center gap-3 px-5 py-4">
              <f.icon className="h-4 w-4 shrink-0 text-ink-400" />
              <span className="text-sm text-ink-700">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CafeteriaFeatures() {
  return (
    <section id="features" className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <FeatureRow
          icon={UtensilsCrossed}
          eyebrow="Smart Cafeteria"
          title="Order before you leave your desk"
          body="Browse live menus with real prices, prep times, and availability, then place your order and pick a pickup time that works for you."
          accent="amber"
          features={[
            { icon: Search, label: 'Search and filter by category or availability' },
            { icon: Clock, label: 'See estimated preparation time before you order' },
            { icon: Bell, label: 'Get notified the moment your food is ready' },
            { icon: MessageSquarePlus, label: 'Request dishes you want to see on future menus' },
            { icon: Vote, label: "Vote in polls for tomorrow's special" },
          ]}
        />
      </div>
    </section>
  );
}

function ChargingFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <FeatureRow
        icon={Zap}
        eyebrow="EV Charging"
        title="Reserve your charging slot in advance"
        reverse
        body="Browse chargers across the campus, pick an open time slot, and confirm with a simulated advance payment. No more circling the lot."
        accent="teal"
        features={[
          { icon: Building2, label: 'Browse every charging station on campus' },
          { icon: CalendarClock, label: 'Pick a date, time, and available charger' },
          { icon: ShieldCheck, label: 'Server-checked slots with no double-booked chargers' },
          { icon: ClipboardList, label: 'Track upcoming, active, and completed reservations' },
          { icon: CheckCircle2, label: 'Cancel according to your campus policy' },
        ]}
      />
    </section>
  );
}

function Benefits() {
  const groups = [
    {
      title: 'For employees',
      icon: Users,
      items: [
        'Know what\'s available before leaving your desk',
        'Order in advance and pick your own pickup time',
        'Get notified the instant your food is ready',
        'Reserve EV charging instead of waiting around',
      ],
    },
    {
      title: 'For cafeteria owners',
      icon: UtensilsCrossed,
      items: [
        'Update availability instantly, no more repeat questions',
        'See every order and its status in one operational view',
        'Run food polls to plan tomorrow\'s specials',
        'Review dish requests and plan future menus',
      ],
    },
    {
      title: 'For charging operators',
      icon: Zap,
      items: [
        'Manage every station and charger from one dashboard',
        'See upcoming and active reservations at a glance',
        'Avoid double-bookings with server-side validation',
        'Track reservation revenue by charger',
      ],
    },
  ];
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl text-ink-900">Built for everyone on campus</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="rounded-2xl border border-line p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">
                <g.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-lg text-ink-900">{g.title}</p>
              <ul className="mt-3 space-y-2.5">
                {g.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-ink-500">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformOverview() {
  const roles = [
    { icon: Users, label: 'Employee', body: 'Order food, request dishes, vote in polls, and book EV charging.' },
    { icon: UtensilsCrossed, label: 'Cafeteria Owner', body: 'Manage menus, orders, polls, and dish requests for one cafeteria.' },
    { icon: Zap, label: 'Charging Operator', body: 'Manage stations, chargers, and reservations across the campus.' },
    { icon: LayoutGrid, label: 'Platform Admin', body: 'Oversee every user, cafeteria, station, and platform activity log.' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-xl">
        <h2 className="font-display text-3xl text-ink-900">One workplace platform, four roles</h2>
        <p className="mt-2 text-ink-500">
          This is an internal services platform, not a food-delivery marketplace. Each part of the
          campus has its own purpose-built view.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => (
          <div key={r.label} className="rounded-2xl border border-line bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
              <r.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 font-medium text-ink-900">{r.label}</p>
            <p className="mt-1.5 text-sm text-ink-400">{r.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const focusAreas = [
    {
      title: 'Before lunch',
      body: 'Check dishes, prices, preparation times, and availability before leaving your desk.',
    },
    {
      title: 'At the cafeteria',
      body: 'Place an order ahead of time and collect it at a suitable pickup time.',
    },
    {
      title: 'At the charging area',
      body: 'View charger availability and reserve a time slot before reaching the parking area.',
    },
  ];
  return (
    <section className="border-y border-line bg-ink-900">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Project focus</p>
        <h2 className="mt-2 font-display text-3xl text-white">
          Designed around everyday campus routines
        </h2>
        <p className="mt-2 max-w-xl text-ink-300">
          This project focuses on making two routine tasks easier to plan during a busy workday: getting lunch and charging an EV.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {focusAreas.map((area) => (
            <div key={area.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="font-medium text-ink-100">{area.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{area.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaDemo() {
  const accounts = [
    { role: 'Employee', email: 'employee@demo.com' },
    { role: 'Cafeteria Owner', email: 'cafeteria@demo.com' },
    { role: 'Charging Operator', email: 'charging@demo.com' },
    { role: 'Platform Admin', email: 'admin@demo.com' },
  ];
  return (
    <section id="demo" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-pop">
        <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-ink-900">See it in action</h2>
            <p className="mt-3 text-ink-500">
              Every workflow in this demo is fully functional. Place a real order, vote in a poll, or
              reserve a charging slot. Log in with any account below to explore that role's dashboard.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-medium text-white hover:bg-ink-700"
            >
              Log in to the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-ink-50 p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-400">
              Demo accounts · password for all: <span className="font-mono text-ink-600">{DEMO_PASSWORD}</span>
            </p>
            <div className="space-y-2">
              {accounts.map((a) => (
                <div
                  key={a.email}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink-700">{a.role}</span>
                  <span className="font-mono text-sm text-ink-400">{a.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 font-display text-xs text-white">
              W
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Workplace Smart Cafeteria &amp; Services Platform
              </p>
              <p className="text-xs text-ink-400">Built for office campuses.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm text-ink-400">
            <Link href="/login" className="hover:text-ink-900">Log in</Link>
            <Link href="/register" className="hover:text-ink-900">Get Started</Link>
            <a href="#demo" className="hover:text-ink-900">Demo</a>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-1 border-t border-line pt-6 text-xs text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>A student prototype by Ahammed Saheel VP &amp; Mohammed Roshan.</p>
          <p>© {new Date().getFullYear()} Workplace Smart Services. MVP build.</p>
        </div>
      </div>
    </footer>
  );
}
