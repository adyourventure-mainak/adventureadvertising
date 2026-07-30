'use strict';
/* ────────────────────────────────────────────────────────────────
   Regional festival campaign planner.

   A deliberate design decision about dates, because getting this
   wrong would cost someone a campaign:

   SOLAR festivals (Pongal, Baisakhi, Poila Boishakh, Lohri) fall on
   the same Gregorian date every year. Those carry `exact: true`.

   LUNAR festivals (Diwali, Durga Puja, Holi, Ganesh Chaturthi) move
   by weeks year to year, and Islamic dates move ~11 days earlier
   annually. Publishing a confidently wrong Diwali date is worse than
   publishing none, so those carry a MONTH WINDOW and `exact: false`,
   and the UI tells the planner to confirm the panchang date before
   committing spend.

   This is not a limitation to apologise for: media is booked six to
   eight weeks out, against a window, not against a single day. The
   window is the actionable number. The exact date matters later, and
   by then you look it up.
   ──────────────────────────────────────────────────────────────── */

/* leadWeeks — when creative should be LOCKED, not when it airs.
   Indian print and OOH inventory for the big two (Durga Puja, Diwali)
   is spoken for far earlier than most first-time advertisers expect. */
const FESTIVALS = [
  /* ── pan-India ─────────────────────────────────────────────── */
  { id: 'diwali', name: 'Diwali', regions: ['ALL'], window: [10, 11], exact: false,
    leadWeeks: 8, spend: 'peak',
    note: 'The single largest advertising window in the Indian year. Inventory and influencer rates are booked out by late August.' },

  { id: 'holi', name: 'Holi', regions: ['ALL'], window: [3, 3], exact: false,
    leadWeeks: 5, spend: 'high',
    note: 'Colour, youth and outdoor. Strong for beverages, FMCG and anything that photographs well.' },

  { id: 'raksha-bandhan', name: 'Raksha Bandhan', regions: ['ALL'], window: [8, 8], exact: false,
    leadWeeks: 4, spend: 'high',
    note: 'Gifting-led. Jewellery, sweets, apparel and courier services all peak.' },

  { id: 'eid', name: 'Eid al-Fitr', regions: ['ALL'], window: [3, 4], exact: false,
    leadWeeks: 5, spend: 'high',
    note: 'Moves about eleven days earlier each year — confirm against the Islamic calendar, not last year\'s date.' },

  { id: 'independence-day', name: 'Independence Day', regions: ['ALL'], month: 8, day: 15, exact: true,
    leadWeeks: 3, spend: 'medium',
    note: 'Crowded and easy to get wrong. Patriotism sells nothing on its own; tie it to something you actually do.' },

  { id: 'republic-day', name: 'Republic Day', regions: ['ALL'], month: 1, day: 26, exact: true,
    leadWeeks: 3, spend: 'medium', note: 'Retail discounting window as much as a civic one.' },

  { id: 'christmas', name: 'Christmas & New Year', regions: ['ALL'], month: 12, day: 25, exact: true,
    leadWeeks: 5, spend: 'high',
    note: 'Strongest in Kerala, Goa, the North-East and metros. Runs straight into New Year retail.' },

  /* ── West Bengal ───────────────────────────────────────────── */
  { id: 'durga-puja', name: 'Durga Puja', regions: ['WB', 'AS', 'OD', 'JH', 'TR'], window: [9, 10], exact: false,
    leadWeeks: 10, spend: 'peak',
    note: 'Bengal\'s commercial year turns on this. Pandal sponsorship, hoardings and print are committed by July — plan earlier than feels sensible.' },

  { id: 'kali-puja', name: 'Kali Puja', regions: ['WB', 'AS', 'TR'], window: [10, 11], exact: false,
    leadWeeks: 6, spend: 'high', note: 'Falls with Diwali; in Bengal the local buy often matters more than the national one.' },

  { id: 'poila-boishakh', name: 'Poila Boishakh (Bengali New Year)', regions: ['WB', 'TR'], month: 4, day: 15, exact: true,
    leadWeeks: 4, spend: 'high',
    note: 'Halkhata season — the traditional opening of new account books. Retail, jewellery and financial services all move.' },

  { id: 'saraswati-puja', name: 'Saraswati Puja', regions: ['WB', 'OD', 'AS'], window: [1, 2], exact: false,
    leadWeeks: 3, spend: 'medium', note: 'Student and education-sector focus. Strong for coaching centres and stationery.' },

  /* ── other states ──────────────────────────────────────────── */
  { id: 'pongal', name: 'Pongal', regions: ['TN', 'PY'], month: 1, day: 14, exact: true,
    leadWeeks: 5, spend: 'peak', note: 'Tamil Nadu\'s biggest retail window. Four days; plan for the whole run.' },

  { id: 'onam', name: 'Onam', regions: ['KL'], window: [8, 9], exact: false,
    leadWeeks: 6, spend: 'peak', note: 'Kerala\'s peak. Gold, apparel and white goods dominate.' },

  { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', regions: ['MH', 'GA', 'KA', 'TG', 'AP'], window: [8, 9], exact: false,
    leadWeeks: 7, spend: 'peak', note: 'Mumbai and Pune inventory tightens sharply. Pandal sponsorship is the local equivalent of Puja in Bengal.' },

  { id: 'navratri', name: 'Navratri & Garba', regions: ['GJ', 'RJ', 'MH'], window: [9, 10], exact: false,
    leadWeeks: 7, spend: 'peak', note: 'Nine nights of live events in Gujarat — sponsorship-led rather than broadcast-led.' },

  { id: 'baisakhi', name: 'Baisakhi', regions: ['PB', 'HR', 'HP'], month: 4, day: 13, exact: true,
    leadWeeks: 4, spend: 'high', note: 'Harvest and rural purchasing power. Tractors, gold, two-wheelers.' },

  { id: 'lohri', name: 'Lohri', regions: ['PB', 'HR', 'HP', 'DL'], month: 1, day: 13, exact: true,
    leadWeeks: 3, spend: 'medium', note: 'Winter, family and food. Short window, strong regional pull.' },

  { id: 'gudi-padwa', name: 'Gudi Padwa', regions: ['MH', 'GA'], window: [3, 4], exact: false,
    leadWeeks: 4, spend: 'high', note: 'Maharashtrian new year — an auspicious purchase window for vehicles and property.' },

  { id: 'vishu', name: 'Vishu', regions: ['KL'], month: 4, day: 14, exact: true,
    leadWeeks: 4, spend: 'medium', note: 'Kerala new year. Gold and gifting.' },

  { id: 'bihu', name: 'Bohag Bihu', regions: ['AS'], month: 4, day: 14, exact: true,
    leadWeeks: 4, spend: 'high', note: 'Assam\'s new year and its strongest regional retail moment.' },

  { id: 'ugadi', name: 'Ugadi', regions: ['KA', 'AP', 'TG'], window: [3, 4], exact: false,
    leadWeeks: 4, spend: 'high', note: 'Telugu and Kannada new year — vehicles, gold, home purchases.' },

  { id: 'wedding-season', name: 'Wedding season', regions: ['ALL'], window: [11, 2], exact: false,
    leadWeeks: 8, spend: 'peak',
    note: 'Not a festival but the biggest sustained spend of all — jewellery, apparel, venues, catering, travel. Runs November through February with a second run in April–May.' }
];

const REGIONS = {
  ALL: 'All India', WB: 'West Bengal', MH: 'Maharashtra', TN: 'Tamil Nadu',
  KL: 'Kerala', KA: 'Karnataka', GJ: 'Gujarat', PB: 'Punjab', RJ: 'Rajasthan',
  DL: 'Delhi NCR', AS: 'Assam', OD: 'Odisha', TG: 'Telangana', AP: 'Andhra Pradesh',
  HR: 'Haryana', HP: 'Himachal Pradesh', JH: 'Jharkhand', TR: 'Tripura',
  GA: 'Goa', PY: 'Puducherry'
};

/* Days until the next occurrence, so a festival that has passed this
   year rolls forward rather than showing as overdue. */
function nextOccurrence(f, from = new Date()) {
  const year = from.getFullYear();

  if (f.exact) {
    let d = new Date(Date.UTC(year, f.month - 1, f.day));
    if (d < from) d = new Date(Date.UTC(year + 1, f.month - 1, f.day));
    return { date: d, exact: true };
  }

  /* Window festivals: aim at the MIDDLE of the window, not its start.
     Targeting the first of the opening month put Durga Puja five weeks
     early, which any Bengali planner would spot instantly — and a
     calendar you can catch out once is a calendar nobody trusts again.
     The lead-time buffer, not a pessimistic date, does the safety work. */
  const [a, b] = f.window;
  const span = b >= a ? (b - a) : (12 - a + b);      /* wedding season wraps Nov→Feb */
  const midMonth = a + span / 2;

  const mk = y => {
    /* A single-month window means "some time in August", so aim at the
       15th rather than the 1st — the 1st reads as a hard date and is
       wrong by a fortnight more often than it is right. */
    const m = Math.floor(midMonth) - 1;
    const day = span === 0 ? 15 : (midMonth % 1 ? 15 : 1);
    return new Date(Date.UTC(y, m, day));
  };

  let d = mk(year);
  if (d < from) d = mk(year + 1);
  return { date: d, exact: false };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function windowLabel(f) {
  if (f.exact) return `${f.day} ${MONTHS[f.month - 1]}`;
  const [a, b] = f.window;
  return a === b ? MONTHS[a - 1] : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`;
}

function upcoming(region = 'ALL', months = 12, now = new Date()) {
  const horizon = new Date(now.getTime() + months * 30.44 * 86400000);

  return FESTIVALS
    .filter(f => region === 'ALL' ? true : (f.regions.includes(region) || f.regions.includes('ALL')))
    .map(f => {
      const { date, exact } = nextOccurrence(f, now);
      const daysAway = Math.round((date - now) / 86400000);
      /* The number that actually matters: when creative must be locked
         and media committed, not when the ad runs. */
      const lockBy = new Date(date.getTime() - f.leadWeeks * 7 * 86400000);
      const daysToLock = Math.round((lockBy - now) / 86400000);

      return {
        id: f.id,
        name: f.name,
        regions: f.regions.map(r => REGIONS[r] || r),
        when: windowLabel(f),
        exactDate: exact,
        approxDate: date.toISOString().slice(0, 10),
        daysAway,
        leadWeeks: f.leadWeeks,
        lockBy: lockBy.toISOString().slice(0, 10),
        daysToLock,
        /* The three states a planner cares about. */
        status: daysToLock < 0 ? (daysAway > 0 ? 'late' : 'passed')
          : daysToLock <= 21 ? 'act-now' : 'ahead',
        spend: f.spend,
        note: f.note
      };
    })
    .filter(f => f.date !== null && f.daysAway <= (horizon - now) / 86400000)
    .sort((a, b) => a.daysAway - b.daysAway);
}

module.exports = { upcoming, FESTIVALS, REGIONS };
