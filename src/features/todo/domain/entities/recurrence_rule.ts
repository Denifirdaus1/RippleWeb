export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  type: RecurrenceType;
  /** Days of the week: 0=Sunday, 1=Monday, ..., 6=Saturday */
  days: number[];
  interval: number;
  until?: string; // ISO date string
  count?: number;
}

// --- Weekday conversion ---

/** JS weekday (0=Sun) → ISO weekday (1=Mon, 7=Sun) */
export function jsToIsoWeekday(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/** ISO weekday (1=Mon, 7=Sun) → JS weekday (0=Sun) */
export function isoToJsWeekday(isoDay: number): number {
  return isoDay === 7 ? 0 : isoDay;
}

// --- Display helpers ---

const WEEKDAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function daysDisplayText(days: number[]): string {
  if (days.length === 0) return '';
  if (days.length === 7) return 'Setiap hari';
  const sorted = [...days].sort();
  const isWeekdays = sorted.length === 5 && [1, 2, 3, 4, 5].every(d => sorted.includes(d));
  if (isWeekdays) return 'Hari kerja';
  const isWeekends = sorted.length === 2 && sorted.includes(0) && sorted.includes(6);
  if (isWeekends) return 'Akhir pekan';
  return sorted.map(d => WEEKDAY_NAMES[d]).join(', ');
}

export function recurrenceDisplayText(rule: RecurrenceRule): string {
  switch (rule.type) {
    case 'daily':
      return rule.interval === 1 ? 'Setiap hari' : `Setiap ${rule.interval} hari`;
    case 'weekly': {
      const dayText = daysDisplayText(rule.days);
      return rule.interval === 1 ? `Setiap ${dayText}` : `Setiap ${rule.interval} minggu: ${dayText}`;
    }
    case 'monthly':
      return rule.interval === 1 ? 'Setiap bulan' : `Setiap ${rule.interval} bulan`;
    case 'custom':
      return 'Kustom';
  }
}

// --- Occurrence calculation ---

export function shouldOccurOnWeekday(rule: RecurrenceRule, date: Date): boolean {
  if (rule.type === 'weekly') {
    const weekday = date.getDay(); // 0=Sun
    return rule.days.includes(weekday);
  }
  return true;
}

export function getNextOccurrence(rule: RecurrenceRule, from: Date): Date | null {
  const candidate = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (rule.until) {
    const untilDate = new Date(rule.until);
    if (candidate > untilDate) return null;
  }

  let next: Date;

  switch (rule.type) {
    case 'daily':
      next = new Date(candidate);
      next.setDate(next.getDate() + rule.interval);
      break;

    case 'weekly': {
      if (rule.days.length === 0) return null;
      next = new Date(candidate);
      for (let i = 1; i <= 7 * rule.interval + 7; i++) {
        next.setDate(next.getDate() + 1);
        if (shouldOccurOnWeekday(rule, next)) break;
      }
      break;
    }

    case 'monthly':
      next = new Date(candidate.getFullYear(), candidate.getMonth() + rule.interval, candidate.getDate());
      break;

    case 'custom':
      return null;

    default:
      return null;
  }

  if (rule.until) {
    const untilDate = new Date(rule.until);
    if (next > untilDate) return null;
  }

  return next;
}

/** Parse a raw JSON recurrence_rule from the database into a RecurrenceRule */
export function parseRecurrenceRule(raw: any): RecurrenceRule | null {
  if (!raw || typeof raw !== 'object') return null;
  const typeStr = raw.type || 'weekly';
  const rawDays = Array.isArray(raw.days) ? raw.days.map((d: number) => isoToJsWeekday(d)) : [];
  return {
    type: typeStr as RecurrenceType,
    days: rawDays,
    interval: raw.interval ?? 1,
    until: raw.until ?? undefined,
    count: raw.count ?? undefined,
  };
}

/** Serialize a RecurrenceRule to the database format (ISO weekdays) */
export function serializeRecurrenceRule(rule: RecurrenceRule): any {
  const isoDays = rule.days.map(jsToIsoWeekday).sort();
  return {
    type: rule.type,
    days: isoDays,
    interval: rule.interval,
    ...(rule.until && { until: rule.until }),
    ...(rule.count !== undefined && { count: rule.count }),
  };
}
