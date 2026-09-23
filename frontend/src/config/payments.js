// Public receiving details used by the checkout UI.
// These are intentionally public payment instructions, not credentials.
export const MPESA_PAYBILL = {
  paybill: "522533",
  accountNumber: "8109391",
  businessName: "ARTNOVAX FOUNDATION",
};

// Keep direct bank transfer hidden until verified receiving details are ready.
// When enabled later, only publish receiving details (bank/account/branch/SWIFT),
// never online-banking credentials, PINs, OTPs, API keys or card details.
export const BANK_TRANSFER_ENABLED = false;
