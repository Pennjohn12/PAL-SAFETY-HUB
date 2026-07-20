export function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function safeFileUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "#";
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.protocol === "https:") return parsed.href;
  } catch (e) {}
  return "#";
}

export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

export function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

export function docIcon(name) {
  if (!name) return "";
  const ext = name.split(".").pop().toLowerCase();
  if (["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "";
  return "";
}

export function exportSlug(value) {
  return String(value || "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "document";
}

export function getCleanFileName(name = "PAL-Project-File") {
  return String(name || "PAL-Project-File")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim() || "PAL-Project-File";
}

export function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(n || 0));
}
