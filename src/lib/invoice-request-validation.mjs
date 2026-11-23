const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const decimal = (scale) => new RegExp("^(0|[1-9][0-9]*)([.][0-9]{1," + scale + "})?$");
const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

export function isValidInvoiceRequest(v) {
  if (!obj(v) || Object.keys(v).sort().join(",") !== "header,idempotencyNamespace,lines,requestId,shopId"
    || v.idempotencyNamespace !== "invoice-create/v1"
    || typeof v.shopId !== "string" || !UUID.test(v.shopId)
    || typeof v.requestId !== "string" || !UUID.test(v.requestId)
    || !obj(v.header) || !Array.isArray(v.lines) || v.lines.length < 1 || v.lines.length > 100) return false;
  const h = v.header;
  if (Object.keys(h).sort().join(",") !== "mapUrl,shopAddress,shopName,shopPhone"
    || ![h.shopName, h.shopAddress, h.shopPhone, h.mapUrl].every(x => typeof x === "string")) return false;
  return v.lines.every(line => obj(line)
    && Object.keys(line).sort().join(",") === "catalogItemId,itemName,quantity,unit,unitPrice"
    && (line.catalogItemId === null || (typeof line.catalogItemId === "string" && UUID.test(line.catalogItemId)))
    && typeof line.itemName === "string"
    && (line.unit === null || typeof line.unit === "string")
    && typeof line.quantity === "string" && decimal(3).test(line.quantity)
    && typeof line.unitPrice === "string" && decimal(2).test(line.unitPrice));
}
