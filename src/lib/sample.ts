// The builder's copy of the sample data, used until a Worker is connected.
// Refresh it from a dummy-mode Worker with `npm run sync-sample`.

import sample from '@/assets/dummy.json';
import type { Dataset, PropertySummary, WidgetData } from '@/types';

interface SampleFile {
  generated: string;
  host: WidgetData;
  properties: PropertySummary[];
  data: Record<string, { property: WidgetData; calendar: { currency: string; calendar: CalendarDay[] }; reviews: WidgetData; guide: WidgetData }>;
}

interface CalendarDay {
  date: string;
  available: boolean;
  price: number | null;
  min_stay: number | null;
}

const SAMPLE = sample as unknown as SampleFile;
const DAY = 86_400_000;

export const sampleProperties: PropertySummary[] = SAMPLE.properties;

/** The sample calendar was saved on a fixed day; move it so it starts today. */
export function shiftCalendar(days: CalendarDay[], now = new Date()): CalendarDay[] {
  if (!days.length) return days;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = Math.round((today - Date.parse(days[0].date + 'T00:00:00Z')) / DAY);
  if (!shift) return days;
  return days.map((d) => ({ ...d, date: new Date(Date.parse(d.date + 'T00:00:00Z') + shift * DAY).toISOString().slice(0, 10) }));
}

/** Merged sample data for the data sets a template uses. */
export function sampleData(propertyId: string, datasets: Dataset[]): WidgetData {
  const id = SAMPLE.data[propertyId] ? propertyId : SAMPLE.properties[0].id;
  const d = SAMPLE.data[id];
  const parts: Record<Dataset, WidgetData> = {
    property: d.property,
    calendar: { ...d.calendar, calendar: shiftCalendar(d.calendar.calendar) },
    reviews: d.reviews,
    guide: d.guide,
    host: SAMPLE.host,
    properties: { properties: SAMPLE.properties },
  };
  const merged: WidgetData = { sample_data: true };
  for (const set of datasets) Object.assign(merged, parts[set]);
  return merged;
}

/** Field names of the property data set, used to cut the fallback snapshot down. */
export const propertyFields: string[] = Object.keys(SAMPLE.data[SAMPLE.properties[0].id].property);
