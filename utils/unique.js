// Letters-only id, unique per call, e.g. "Bcjdhgafie". Name fields reject digits, and
// production already holds many identically named records from earlier runs.
export function uniqueName() {
  const n = Date.now() * 1000 + Math.floor(Math.random() * 1000)
  const letters = [...n.toString(26)].map(c => String.fromCharCode(97 + parseInt(c, 26))).join('')
  return letters[0].toUpperCase() + letters.slice(1)
}
