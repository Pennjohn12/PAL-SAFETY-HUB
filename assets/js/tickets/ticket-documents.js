import { esc, exportSlug, money } from "../utils/format.js";

export function ticketDocumentHTML(ticket, styles = "", includePrintButton = true) {
  const actions = includePrintButton
    ? `<div class="ticket-file-actions">
        <button style="display:inline-block!important" onclick="window.print()">Print / Save as PDF</button>
        <button style="display:inline-block!important" onclick="window.close()">Close</button>
      </div>`
    : "";

  return `<!doctype html>
    <html>
      <head>
        <title>PAL Safety Hub - Extra Work Ticket</title>
        <style>
          ${styles}
          body{background:#fff;padding:16px}
          .modal-actions,.header,.tabs,button{display:none!important}
          .ticket-paper{max-width:980px;margin:auto}
          .ticket-file-actions{display:flex!important;justify-content:center;gap:10px;margin:0 0 12px}
          @media print{.ticket-file-actions{display:none!important}}
        </style>
      </head>
      <body>${actions}${ticketPaperHTML(ticket)}</body>
    </html>`;
}

export function ticketFileName(ticket, fallback = "ticket") {
  return `pal-ticket-${exportSlug(ticket?.projectName || "project")}-${exportSlug(ticket?.ticketNo || ticket?.date || fallback)}.html`;
}

export function ticketPaperHTML(ticket = {}) {
  const laborRows = (ticket.labor || []).map(row => `
    <tr>
      <td>${esc(row.name || "")}</td>
      <td>${esc(row.trade || "")}</td>
      <td>${row.st || ""}</td>
      <td>${row.ot || ""}</td>
      <td>${row.dt || ""}</td>
      <td>${money(row.rate || 0)}</td>
      <td>${money(row.total || 0)}</td>
    </tr>`).join("") || '<tr><td colspan="7">No labor listed</td></tr>';

  const materialRows = (ticket.materials || []).map(row => `
    <tr>
      <td>${row.qty || ""}</td>
      <td>${esc(row.unit || "")}</td>
      <td>${esc(row.description || "")}</td>
      <td>${money(row.unitCost || 0)}</td>
      <td>${money(row.total || 0)}</td>
    </tr>`).join("") || '<tr><td colspan="5">No materials listed</td></tr>';

  const equipmentRows = (ticket.equipment || []).map(row => `
    <tr>
      <td>${row.qty || ""}</td>
      <td>${esc(row.description || "")}</td>
      <td>${money(row.rate || 0)}</td>
      <td>${money(row.total || 0)}</td>
    </tr>`).join("") || '<tr><td colspan="4">No equipment listed</td></tr>';

  const contractorSignature = ticket.contractorSignature
    ? `<img src="${ticket.contractorSignature}" style="max-height:55px;max-width:100%;">`
    : "<br><br>";
  const palSignature = ticket.palSignature
    ? `<img src="${ticket.palSignature}" style="max-height:55px;max-width:100%;">`
    : "<br><br>";

  return `
    <div class="ticket-paper">
      <div class="ticket-top">
        <div class="ticket-logo-box">PAL<small>ENVIRONMENTAL SERVICES</small></div>
        <div class="ticket-title">Daily Extra Work Order</div>
        <div class="ticket-no-box"><div class="ticket-label">Ticket No.</div>${esc(ticket.ticketNo || "-")}</div>
      </div>
      <div class="ticket-line-grid">
        <div class="cell wide"><div class="ticket-label">Project / Jobsite</div>${esc(ticket.projectName || "-")}</div>
        <div class="cell"><div class="ticket-label">Date</div>${esc(ticket.date || "-")}</div>
        <div class="cell"><div class="ticket-label">Status</div>${esc(ticket.status || "Submitted")}</div>
        <div class="cell"><div class="ticket-label">PAL Job No.</div>${esc(ticket.jobNumber || ticket.projectJobNumber || "-")}</div>
        <div class="cell wide"><div class="ticket-label">Contractor / Authorized By</div>${esc(ticket.authorizedBy || "-")}</div>
        <div class="cell"><div class="ticket-label">Location / Floor</div>${esc(ticket.location || "-")}</div>
        <div class="cell"><div class="ticket-label">Work Type</div>${esc(ticket.workType || "-")}</div>
      </div>
      <div class="ticket-label">Authorization to proceed / Description of extra work</div>
      <div style="border:1px solid #555;min-height:70px;padding:8px;white-space:pre-line;">${esc(ticket.description || "-")}</div>
      <div class="ticket-section-head">Labor / Time</div>
      <table class="ticket-table">
        <thead><tr><th>Employee / Classification</th><th>Trade</th><th>ST Hrs</th><th>OT Hrs</th><th>DT Hrs</th><th>Rate</th><th>Total</th></tr></thead>
        <tbody>${laborRows}</tbody>
      </table>
      <div class="ticket-section-head">Material</div>
      <table class="ticket-table">
        <thead><tr><th>Qty</th><th>Unit</th><th>Description</th><th>Unit Cost</th><th>Total</th></tr></thead>
        <tbody>${materialRows}</tbody>
      </table>
      <div class="ticket-section-head">Equipment Rental / Trucking</div>
      <table class="ticket-table">
        <thead><tr><th>Qty / Days</th><th>Description</th><th>Rate</th><th>Total</th></tr></thead>
        <tbody>${equipmentRows}</tbody>
      </table>
      <div class="ticket-summary">
        <div>
          <div class="ticket-label">Notes</div>
          <div style="border:1px solid #555;min-height:70px;padding:8px;white-space:pre-line;">${esc(ticket.notes || "")}</div>
          <div class="ticket-sign-grid">
            <div class="ticket-sign-box"><div class="ticket-label">Contractor Signature</div>${contractorSignature}</div>
            <div class="ticket-sign-box"><div class="ticket-label">PAL Accepted By</div>${palSignature}</div>
          </div>
        </div>
        <div class="ticket-total-box">
          ${ticketTotalRow("Labor Total", ticket.laborTotal)}
          ${ticketTotalRow("Material Total", ticket.materialTotal)}
          ${ticketTotalRow("Equipment / Rental", ticket.equipmentTotal)}
          ${ticketTotalRow("Bond / Insurance", ticket.bondTotal)}
          ${ticketTotalRow("Tax", ticket.taxTotal)}
          ${ticketTotalRow("Other / Markup", ticket.otherTotal)}
          <div class="ticket-total-row ticket-grand-row"><span>Grand Total</span><span>${money(ticket.grandTotal || 0)}</span></div>
        </div>
      </div>
    </div>`;
}

function ticketTotalRow(label, value) {
  return `<div class="ticket-total-row"><span>${esc(label)}</span><span>${money(value || 0)}</span></div>`;
}
