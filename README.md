# Caderno de Erros | Tais Elena

Uma ferramenta para transformar erros em acertos.

- **Front-end:** React + TypeScript + Tailwind (Vite), publicado no **GitHub Pages** e instalável como aplicativo (PWA).
- **Back-end:** **Firebase** (plano gratuito Spark). O Firestore guarda os dados e o Authentication faz o login com Google.
- **Offline:** o Firestore mantém uma cópia em IndexedDB. O app abre e grava sem internet e envia as alterações quando a conexão volta.

---

## 1. Firebase (uma vez)

1. Acesse <https://console.firebase.google.com> → **Criar projeto** → nome `caderno-erros`. Analytics e Gemini podem ficar desativados.
   O projeto nasce no plano **Spark (gratuito)**. **Não** vincule cartão nem faça upgrade.
2. **Criação → Firestore Database → Criar banco de dados**
   - Edição **Standard**.
   - Local: **`southamerica-east1 (São Paulo)`**. Não pode ser trocado depois.
   - **Modo de produção.**
   - Na aba **Regras**, cole o conteúdo de [`firestore.rules`](firestore.rules) e clique em **Publicar**.
3. **Criação → Authentication → Vamos começar → Sign-in method → Google → Ativar** → escolha o e-mail de suporte → Salvar.
4. **Authentication → Configurações → Domínios autorizados → Adicionar domínio:** `SEU-USUARIO.github.io`.
5. **Configurações do projeto (engrenagem) → Seus apps → `</>` Web** → apelido `caderno-erros-web`. **Não** marque Firebase Hosting.
   Copie os seis valores do `firebaseConfig` mostrado.

> Os valores do `firebaseConfig` não são secretos: identificam o projeto. Quem protege os dados são as regras do Firestore, em que cada conta só acessa `usuarios/{seu-uid}/...`.

## 2. GitHub (uma vez)

1. Crie o repositório (por exemplo `caderno-erros`) e envie este projeto:
   ```bash
   git init && git add . && git commit -m "Caderno de Erros"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/caderno-erros.git
   git push -u origin main
   ```
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → aba Variables → New repository variable.** Crie as seis variáveis com os valores do passo 1.5:

   | Variável | Campo do firebaseConfig |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

4. **Actions → Publicar no GitHub Pages → Run workflow**, ou faça um novo push.
   Em 1 a 2 minutos o site fica no ar em `https://SEU-USUARIO.github.io/caderno-erros/`.

A cada push na `main`, o workflow roda os testes, gera o build e publica.

## 3. Trazer os registros do caderno anterior

1. No caderno antigo (o artifact do Claude): **Backup e configurações → Exportar JSON**.
2. No novo, depois de entrar com a conta Google: **Backup e configurações → Importar backup** → escolha o arquivo → **Juntar com os atuais**.

Registros sem origem entram como "Não classificado".

## 4. Instalar como aplicativo

- **Android (Chrome):** abra o site → menu ⋮ → **Instalar app**.
- **iPhone (Safari):** abra o site → **Compartilhar** → **Adicionar à Tela de Início**.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço.

No iPhone, o app instalado tem armazenamento separado do Safari. Por isso é preciso entrar com o Google uma vez dentro do próprio app.

## 5. Restringir quem pode usar (opcional)

Do jeito que está, qualquer conta Google consegue entrar, mas cada uma vê só os próprios dados. Para liberar apenas contas específicas, use a variante comentada em `firestore.rules`:

```
allow read, write: if request.auth != null && request.auth.uid == uid
  && request.auth.token.email in ['taiselena759@gmail.com'];
```

## Limites do plano gratuito (Spark)

Cerca de 1 GiB de dados, 50 mil leituras e 20 mil gravações por dia. O uso de uma pessoa fica muito abaixo disso. Se uma cota diária estourar, o Firestore para até a renovação, e as alterações ficam guardadas no aparelho.

---

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha com o firebaseConfig
npm run dev
```

Com o emulador do Firebase (requer Java 11+ e `npm i -g firebase-tools`):

```bash
npm run emuladores           # terminal 1: Auth (9099) e Firestore (8080)
npm run dev:emulador         # terminal 2: app apontando para os emuladores
```

No modo emulador, a tela de login mostra "Entrar como conta de teste". Esse botão não existe no build de produção.

Testes:

```bash
npm test                     # lógica: filtros, estatísticas, backup
npm run test:regras          # regras do Firestore no emulador
```

`vite.teste.config.ts` gera um build com um Firestore falso em memória (`tests/fake/`), usado para testes de interface sem rede.

## Estrutura dos dados

```
usuarios/{uid}                       { criadoEm, email }
usuarios/{uid}/materias/{materiaId}  { nome, topicos[], ordem }
usuarios/{uid}/erros/{erroId}        { materiaId, topico, descricao, correcao, comoEvitar,
                                       prioridade, origem, referencia, criadoEm,
                                       atualizadoEm, revisoes, ultimaRevisao, historico[] }
```

Edições gravam só os campos alterados (`updateDoc`). Histórico e contador de revisões usam `arrayUnion` e `increment`. Assim, alterações em campos diferentes feitas em aparelhos diferentes não se sobrescrevem.

```
src/
  lib/firebase.ts    inicialização, login, emulador
  lib/store.ts       estado, assinaturas do Firestore, ações
  lib/backup.ts      exportação/importação com validação
  lib/stats.ts       estatísticas e séries
  lib/filtros.ts     busca e filtros
  pages/             telas
  components/        interface compartilhada
```
