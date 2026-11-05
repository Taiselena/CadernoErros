/* Firestore falso (em memória + localStorage) com a mesma API usada por src/lib/store.ts. Só para testes de interface. */
type Dados = Record<string, unknown>;
const CHAVE = 'fake-firestore';
const banco: Map<string, Dados> = new Map(JSON.parse(localStorage.getItem(CHAVE) ?? '[]'));
const ouvintes = new Set<() => void>();
const persistir = () => { localStorage.setItem(CHAVE, JSON.stringify([...banco])); queueMicrotask(() => ouvintes.forEach((f) => f())); };

class Sentinela { constructor(public tipo: 'union' | 'remove' | 'inc', public valores: unknown[]) {} }
export const arrayUnion = (...v: unknown[]) => new Sentinela('union', v);
export const arrayRemove = (...v: unknown[]) => new Sentinela('remove', v);
export const increment = (n: number) => new Sentinela('inc', [n]);

export type DocumentReference = { path: string; id: string };
export type WriteBatch = ReturnType<typeof writeBatch>;
export type Unsubscribe = () => void;
export const doc = (_db: unknown, ...p: string[]): DocumentReference => ({ path: p.join('/'), id: p[p.length - 1] });
export const collection = (_db: unknown, ...p: string[]) => ({ path: p.join('/') });

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function aplicar(atual: Dados, mud: Dados): Dados {
  const r = { ...atual };
  for (const [k, v] of Object.entries(mud)) {
    if (v === undefined) continue;
    if (v instanceof Sentinela) {
      const arr = Array.isArray(r[k]) ? [...(r[k] as unknown[])] : [];
      if (v.tipo === 'union') v.valores.forEach((x) => { if (!arr.some((y) => igual(x, y))) arr.push(x); });
      if (v.tipo === 'remove') { r[k] = arr.filter((y) => !v.valores.some((x) => igual(x, y))); continue; }
      r[k] = v.tipo === 'inc' ? (Number(r[k]) || 0) + (v.valores[0] as number) : arr;
    } else r[k] = JSON.parse(JSON.stringify(v));
  }
  return r;
}
const limpo = (d: Dados) => aplicar({}, d);

export const setDoc = async (ref: DocumentReference, d: Dados) => { banco.set(ref.path, limpo(d)); persistir(); };
export const updateDoc = async (ref: DocumentReference, d: Dados) => {
  const atual = banco.get(ref.path);
  if (!atual) throw Object.assign(new Error('not found'), { code: 'not-found' });
  banco.set(ref.path, aplicar(atual, d)); persistir();
};
export const deleteDoc = async (ref: DocumentReference) => { banco.delete(ref.path); persistir(); };
export const getDoc = async (ref: DocumentReference) => ({ exists: () => banco.has(ref.path), data: () => banco.get(ref.path) });
export function writeBatch(_db: unknown) {
  const ops: (() => void)[] = [];
  const b = {
    set: (r: DocumentReference, d: Dados) => { ops.push(() => banco.set(r.path, limpo(d))); return b; },
    update: (r: DocumentReference, d: Dados) => { ops.push(() => banco.set(r.path, aplicar(banco.get(r.path) ?? {}, d))); return b; },
    delete: (r: DocumentReference) => { ops.push(() => banco.delete(r.path)); return b; },
    commit: async () => { ops.forEach((o) => o()); persistir(); },
  };
  return b;
}
export function onSnapshot(col: { path: string }, _o: unknown, next: (s: unknown) => void) {
  const emitir = () => {
    const prefixo = col.path + '/';
    const docs = [...banco].filter(([p]) => p.startsWith(prefixo) && !p.slice(prefixo.length).includes('/'))
      .map(([p, d]) => ({ id: p.slice(prefixo.length), data: () => d }));
    next({ docs, metadata: { hasPendingWrites: false, fromCache: false } });
  };
  ouvintes.add(emitir);
  queueMicrotask(emitir);
  return () => ouvintes.delete(emitir);
}
