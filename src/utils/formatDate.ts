export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("ru-RU", options).format(date);
}
