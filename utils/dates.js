// A date `days` from today, in each format the app shows it
export function daysFromToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = n => String(n).padStart(2, '0')
  return {
    input: `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`, // 12/15/2026, typed into date pickers
    short: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), // Dec 15, 2026, in lists
    long: date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }), // November 07, 2026, on details
  }
}

// "09:00", "10:30" -> lists show "09:00 AM - 10:30 AM", details show "9:00 AM - 10:30 AM"
export function timeRange(start, end) {
  const format = (hhmm, padHour) => {
    const [h, m] = hhmm.split(':').map(Number)
    const hour = h % 12 || 12
    return `${padHour ? String(hour).padStart(2, '0') : hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
  }
  return {
    list: `${format(start, true)} - ${format(end, true)}`,
    detail: `${format(start, false)} - ${format(end, false)}`,
  }
}
