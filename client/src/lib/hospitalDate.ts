/** Match the official backend's hospital calendar rather than the device timezone. */
export function hospitalDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (name: string) => parts.find(part => part.type === name)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
