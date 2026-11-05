export const configurado = true;
export const usandoEmulador = true;
export const auth = {};
export const db = {};
export async function entrarComGoogle() { localStorage.setItem('fake-auth', 'tais@teste.com'); location.reload(); }
export async function entrarTeste(email: string) { localStorage.setItem('fake-auth', email); location.reload(); }
export async function sair() { localStorage.removeItem('fake-auth'); }
export const mensagemErroAuth = () => 'erro';
