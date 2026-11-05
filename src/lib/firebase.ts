import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider, connectAuthEmulator, getAuth, signInWithCredential, signInWithPopup, signInWithRedirect, signOut,
  type Auth,
} from 'firebase/auth';
import {
  clearIndexedDbPersistence, connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  terminate, type Firestore,
} from 'firebase/firestore';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const usandoEmulador = env.VITE_USE_EMULATOR === 'true';

/** Falta configuração do Firebase (variáveis VITE_FIREBASE_* não definidas no build). */
export const configurado = usandoEmulador || !!(config.apiKey && config.projectId && config.appId && config.authDomain);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (configurado) {
  app = initializeApp(usandoEmulador ? { apiKey: 'emulador', projectId: config.projectId ?? 'demo-caderno', authDomain: 'localhost' } : config);
  auth = getAuth(app);
  auth.languageCode = 'pt';
  db = initializeFirestore(app, {
    // cache em IndexedDB: o app abre e grava sem internet e envia quando a conexão volta
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  });
  if (usandoEmulador) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
}

export { auth, db };

export async function entrarComGoogle() {
  if (!auth) return;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = (e as { code?: string }).code;
    // navegadores que bloqueiam pop-up: usa redirecionamento
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

/** Só no emulador: entra com uma conta Google fictícia (usado nos testes). */
export async function entrarTeste(email: string) {
  if (!auth || !usandoEmulador) return;
  const sub = email.replace(/[^a-z0-9]/gi, '');
  await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub, email, email_verified: true, name: email.split('@')[0] })));
}

export async function sair() {
  if (!auth || !db) return;
  await signOut(auth);
  // remove a cópia local dos dados deste aparelho (útil em computador compartilhado)
  try { await terminate(db); await clearIndexedDbPersistence(db); } catch { /* outra aba aberta: o cache fica até ela fechar */ }
}

export function mensagemErroAuth(e: unknown): string {
  const code = (e as { code?: string }).code ?? '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Login cancelado.';
  if (code === 'auth/unauthorized-domain') return 'Este endereço não está autorizado no Firebase. Adicione o domínio em Authentication → Settings → Authorized domains.';
  if (code === 'auth/network-request-failed') return 'Sem conexão com a internet. Tente de novo quando estiver online.';
  if (code === 'auth/operation-not-allowed') return 'O login com Google não está ativado no Firebase (Authentication → Sign-in method).';
  return 'Não foi possível entrar. Tente novamente.';
}
