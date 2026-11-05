import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-caderno',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => { await env?.cleanup(); });

describe('regras do Firestore', () => {
  it('a dona lê, grava e exclui os próprios erros', async () => {
    const db = env.authenticatedContext('tais').firestore();
    await assertSucceeds(setDoc(doc(db, 'usuarios/tais/erros/e1'), { descricao: 'x' }));
    await assertSucceeds(getDoc(doc(db, 'usuarios/tais/erros/e1')));
    await assertSucceeds(deleteDoc(doc(db, 'usuarios/tais/erros/e1')));
  });
  it('outra conta não lê nem grava os dados dela', async () => {
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'usuarios/tais/erros/e2'), { descricao: 'x' }); });
    const outro = env.authenticatedContext('gabriel').firestore();
    await assertFails(getDoc(doc(outro, 'usuarios/tais/erros/e2')));
    await assertFails(setDoc(doc(outro, 'usuarios/tais/erros/e3'), { descricao: 'y' }));
  });
  it('sem login nada é acessível', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'usuarios/tais/erros/e2')));
    await assertFails(setDoc(doc(anon, 'qualquer/coisa'), { a: 1 }));
  });
});
