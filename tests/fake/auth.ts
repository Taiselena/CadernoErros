export type User = { uid: string; displayName: string; email: string; photoURL: null };
export function onAuthStateChanged(_a: unknown, cb: (u: User | null) => void) {
  const email = localStorage.getItem('fake-auth');
  queueMicrotask(() => cb(email ? { uid: email.replace(/\W/g, ''), displayName: 'Tais Elena', email, photoURL: null } : null));
  return () => {};
}
