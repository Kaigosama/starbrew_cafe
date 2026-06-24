// Shared drink pricing helpers. Size/milk price modifiers come live from the
// `customization_options` table (per menu_item_id) — see item-detail.tsx.
// Add-ons aren't in that table yet, so they stay a flat constant here.

export const ADD_ON_PRICE = 20;

// Formats a price_modifier value for display, e.g. "+₱25" / "−₱30" / "" (when 0).
export function formatModifier(value: number): string {
  if (!value) return '';
  return value > 0 ? `+₱${value}` : `−₱${Math.abs(value)}`;
}
