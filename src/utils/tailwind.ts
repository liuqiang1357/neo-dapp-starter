export function tw(strings: TemplateStringsArray, ...keys: any[]): string {
  return keys.reduce((acc, key, i) => acc + strings[i] + key, '') + strings[keys.length];
}
