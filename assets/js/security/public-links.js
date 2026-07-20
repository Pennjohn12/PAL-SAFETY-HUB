export function generateSecureToken() {
  try {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return `tok_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  }
}

export function getShareableProjectsPageUrl(publicProjectsUrl) {
  const localHostnames = ["", "localhost", "127.0.0.1"];
  const isLocalFile = window.location.protocol === "file:";
  const isLocalHost = localHostnames.includes(window.location.hostname);
  if (isLocalFile || isLocalHost) return publicProjectsUrl;

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  if (!url.pathname.toLowerCase().endsWith("/projects.html")) {
    url.pathname = url.pathname.replace(/\/?$/, "/projects.html");
  }
  return url.toString();
}

export function getSafetySignatureLink(publicProjectsUrl, projectId, formId, token) {
  const url = new URL(getShareableProjectsPageUrl(publicProjectsUrl));
  url.search = "";
  url.hash = "";
  url.searchParams.set("safetyProjectId", projectId);
  url.searchParams.set("safetyFormId", formId);
  url.searchParams.set("safetyToken", token);
  return url.toString();
}

export function getTicketSignatureLink(publicProjectsUrl, projectId, ticketId, token) {
  const url = new URL(getShareableProjectsPageUrl(publicProjectsUrl));
  url.search = "";
  url.hash = "";
  url.searchParams.set("ticketProjectId", projectId);
  url.searchParams.set("ticketId", ticketId);
  url.searchParams.set("ticketToken", token);
  return url.toString();
}

export function signatureExpiryDate(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function normalizeDateValue(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isDateExpired(value) {
  const date = normalizeDateValue(value);
  return !!date && date.getTime() <= Date.now();
}

export function publicTicketSnapshot(ticket, project = {}) {
  const {
    gcSignatureToken,
    gcSignatureLinkCreatedAt,
    gcSignatureLinkCreatedBy,
    gcSignatureLinkCreatedByName,
    ...safeTicket
  } = ticket || {};

  return {
    ...safeTicket,
    projectId: project.id || safeTicket.projectId || "",
    projectName: project.name || safeTicket.projectName || "",
    projectJobNumber: project.jobNumber || safeTicket.projectJobNumber || safeTicket.jobNumber || ""
  };
}

export async function writeClipboardText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const copied = document.execCommand("copy");
    ta.remove();
    return copied;
  }
}
