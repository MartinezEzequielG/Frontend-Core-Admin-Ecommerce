export function slugify(input: string) {
  return input
    .normalize('NFKD')
  // quita diacríticos (acentos)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  // reemplaza no alfanum por guiones
    .replace(/[^a-z0-9]+/g, '-')
  // recorta guiones extremos y colapsa múltiples
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}