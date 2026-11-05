export function novoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** AAAA-MM-DD ou ISO completo → DD/MM/AAAA */
export function formatarData(s: string | undefined | null): string {
  if (!s) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [a, m, d] = s.split('-');
    return `${d}/${m}/${a}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Converte ISO completo para AAAA-MM-DD local. */
export function diaDe(s: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? hojeISO() : isoLocal(d);
}

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function pct(parte: number, total: number): number {
  return total ? Math.round((parte / total) * 100) : 0;
}

export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ');
}
