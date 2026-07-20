import { esc, money } from "../utils/format.js";

export function ticketLaborRowHTML(row = {}) {
  return `
    <td><input class="tl-name" value="${esc(row.name || "")}" placeholder="Name / classification"></td>
    <td><input class="tl-trade" value="${esc(row.trade || "")}" placeholder="Trade"></td>
    <td><input type="number" step="0.25" class="tl-st" value="${row.st || ""}" oninput="updateTicketGrandTotal()"></td>
    <td><input type="number" step="0.25" class="tl-ot" value="${row.ot || ""}" oninput="updateTicketGrandTotal()"></td>
    <td><input type="number" step="0.25" class="tl-dt" value="${row.dt || ""}" oninput="updateTicketGrandTotal()"></td>
    <td><input type="number" step="0.01" class="tl-rate" value="${row.rate || ""}" oninput="updateTicketGrandTotal()" placeholder="0.00"></td>
    <td><input class="tl-total" readonly value="$0.00"></td>
    <td><button type="button" class="row-btn" onclick="removeTicketRow(this)">Remove</button></td>`;
}

export function ticketMaterialRowHTML(row = {}) {
  return `
    <td><input type="number" step="0.01" class="tm-qty" value="${row.qty || ""}" oninput="updateTicketGrandTotal()"></td>
    <td><input class="tm-unit" value="${esc(row.unit || "")}" placeholder="EA / bags"></td>
    <td><input class="tm-desc" value="${esc(row.description || "")}" placeholder="Material description"></td>
    <td><input type="number" step="0.01" class="tm-cost" value="${row.unitCost || ""}" oninput="updateTicketGrandTotal()" placeholder="0.00"></td>
    <td><input class="tm-total" readonly value="$0.00"></td>
    <td><button type="button" class="row-btn" onclick="removeTicketRow(this)">Remove</button></td>`;
}

export function ticketEquipmentRowHTML(row = {}) {
  return `
    <td><input type="number" step="0.01" class="te-qty" value="${row.qty || ""}" oninput="updateTicketGrandTotal()"></td>
    <td><input class="te-desc" value="${esc(row.description || "")}" placeholder="Lift / dumpster / rental"></td>
    <td><input type="number" step="0.01" class="te-rate" value="${row.rate || ""}" oninput="updateTicketGrandTotal()" placeholder="0.00"></td>
    <td><input class="te-total" readonly value="$0.00"></td>
    <td><button type="button" class="row-btn" onclick="removeTicketRow(this)">Remove</button></td>`;
}

export function collectTicketRowsFromDocument(doc = document) {
  const labor = Array.from(doc.querySelectorAll("#ticket-labor-rows tr")).map(tr => {
    const st = Number(tr.querySelector(".tl-st")?.value || 0);
    const ot = Number(tr.querySelector(".tl-ot")?.value || 0);
    const dt = Number(tr.querySelector(".tl-dt")?.value || 0);
    const rate = Number(tr.querySelector(".tl-rate")?.value || 0);
    return {
      name: tr.querySelector(".tl-name")?.value.trim() || "",
      trade: tr.querySelector(".tl-trade")?.value.trim() || "",
      st,
      ot,
      dt,
      rate,
      total: calculateLaborRowTotal({ st, ot, dt, rate })
    };
  }).filter(row => row.name || row.trade || row.st || row.ot || row.dt || row.rate);

  const materials = Array.from(doc.querySelectorAll("#ticket-material-rows tr")).map(tr => {
    const qty = Number(tr.querySelector(".tm-qty")?.value || 0);
    const unitCost = Number(tr.querySelector(".tm-cost")?.value || 0);
    return {
      qty,
      unit: tr.querySelector(".tm-unit")?.value.trim() || "",
      description: tr.querySelector(".tm-desc")?.value.trim() || "",
      unitCost,
      total: qty * unitCost
    };
  }).filter(row => row.qty || row.unit || row.description || row.unitCost);

  const equipment = Array.from(doc.querySelectorAll("#ticket-equipment-rows tr")).map(tr => {
    const qty = Number(tr.querySelector(".te-qty")?.value || 0);
    const rate = Number(tr.querySelector(".te-rate")?.value || 0);
    return {
      qty,
      description: tr.querySelector(".te-desc")?.value.trim() || "",
      rate,
      total: qty * rate
    };
  }).filter(row => row.qty || row.description || row.rate);

  return { labor, materials, equipment };
}

export function calculateTicketTotals(rows, extra = {}) {
  const laborTotal = rows.labor.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const materialTotal = rows.materials.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const equipmentTotal = rows.equipment.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const bondTotal = Number(extra.bondTotal || 0);
  const taxTotal = Number(extra.taxTotal || 0);
  const otherTotal = Number(extra.otherTotal || 0);

  return {
    laborTotal,
    materialTotal,
    equipmentTotal,
    bondTotal,
    taxTotal,
    otherTotal,
    grandTotal: laborTotal + materialTotal + equipmentTotal + bondTotal + taxTotal + otherTotal
  };
}

export function updateTicketRowTotals(doc = document, rows) {
  doc.querySelectorAll("#ticket-labor-rows tr").forEach((tr, index) => {
    const el = tr.querySelector(".tl-total");
    if (el) el.value = money(rows.labor[index]?.total || 0);
  });
  doc.querySelectorAll("#ticket-material-rows tr").forEach((tr, index) => {
    const el = tr.querySelector(".tm-total");
    if (el) el.value = money(rows.materials[index]?.total || 0);
  });
  doc.querySelectorAll("#ticket-equipment-rows tr").forEach((tr, index) => {
    const el = tr.querySelector(".te-total");
    if (el) el.value = money(rows.equipment[index]?.total || 0);
  });
}

function calculateLaborRowTotal(row) {
  return (Number(row.st || 0) + Number(row.ot || 0) * 1.5 + Number(row.dt || 0) * 2) * Number(row.rate || 0);
}
