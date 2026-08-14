export function openWA(phone, text = "") {
  const digitsOnly = (phone || "").toString().replace(/\D/g, "");

  if (!digitsOnly) {
    console.warn("openWA: no valid phone number provided, WhatsApp chat not opened.");
    return;
  }

  const url = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
