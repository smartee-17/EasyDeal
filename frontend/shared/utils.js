/**
 * Opens a WhatsApp chat window with a pre-filled message
 * @param {string} phone - The recipient's phone number
 * @param {string} messageText - The clear text message to send
 */
export function openWA(phone, messageText) {
  if (!phone) {
    console.warn("No WhatsApp number provided.");
    return;
  }
  const encodedMsg = encodeURIComponent(messageText);
  window.open(`https://wa.me{phone}?text=${encodedMsg}`, "_blank");
}
