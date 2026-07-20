export const projectHistoryLabels = {
  docs: "Documents",
  photos: "Photos",
  reports: "Daily Reports",
  fieldForms: "Field Forms",
  tickets: "Tickets",
  warehouse: "Warehouse"
};

export function getMonthWeekRanges(monthValue) {
  const [year, month] = String(monthValue || "").split("-").map(Number);
  if (!year || !month) return [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const ranges = [];
  let start = startOfWeek(monthStart);
  while (start < monthEnd) {
    const end = addDays(start, 7);
    ranges.push({
      start: toDateInput(start < monthStart ? monthStart : start),
      end: toDateInput(end > monthEnd ? monthEnd : end)
    });
    start = end;
  }
  return ranges;
}

export function addDays(value, days) {
  const d = typeof value === "string" ? new Date(value + "T00:00:00") : new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatShortDate(value) {
  try {
    return new Date(value + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  } catch {
    return value;
  }
}

export function projectHistoryItemMatches(item, kind, controls = {}) {
  const month = controls.month || "";
  const week = controls.week || "all";
  const search = String(controls.search || "").trim().toLowerCase();
  const d = projectRecordDate(item, kind);

  if (month) {
    if (!d) return false;
    const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (itemMonth !== month) return false;
  }

  if (week && week !== "all") {
    if (!d) return false;
    const [start, end] = week.split("|").map(v => new Date(v + "T00:00:00"));
    if (d < start || d >= end) return false;
  }

  if (search && !JSON.stringify(item).toLowerCase().includes(search)) return false;
  return true;
}

function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function toDateInput(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function projectRecordDate(item = {}, kind = "") {
  const data = item.documentData || {};
  const value = kind === "fieldForms"
    ? (data.date || data.reportDate || data.inspection_date || data.sup_date || data.week_start || item.localSubmittedAt || item.submittedAt)
    : kind === "docs"
      ? (item.uploadedAt || item.createdAt)
      : kind === "photos"
        ? (item.uploadedAt || item.createdAt)
        : kind === "reports"
          ? (item.date || item.submittedAt || item.createdAt)
          : kind === "tickets"
            ? (item.date || item.createdAt)
            : (item.date || item.movedAt || item.createdAt || item.updatedAt);
  return normalizeProjectDate(value);
}

function normalizeProjectDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value + "T00:00:00");
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
