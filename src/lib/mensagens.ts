export const MENSAGENS: string[] = [
  'Cada erro corrigido é um passo a mais em direção à aprovação.',
  'Você não precisa ser perfeita hoje. Precisa ser melhor do que ontem.',
  'Quem aprende com os próprios erros chega mais preparada à prova.',
  'A aprovação é construída nos dias em que você decide não desistir.',
  'Não tenha medo de errar nas questões. Tenha compromisso em não repetir os mesmos erros.',
  'Seu concorrente pode estudar mais questões. Mas você pode aprender mais com cada uma delas.',
  'Disciplina é continuar mesmo quando a motivação não aparece.',
  'Errar no treino é o preço baixo que evita errar na prova.',
  'Constância vence intensidade. Um pouco todos os dias leva longe.',
  'Cada questão errada hoje é uma questão garantida no dia da prova.',
  'O edital é grande, mas você é maior quando divide o caminho em pequenos passos.',
  'Revisar o erro é transformar dúvida em certeza.',
  'Ninguém passa por sorte. Passa quem insiste até dominar.',
  'Seu caderno de erros é o mapa do que falta para a aprovação.',
  'A vaga não é de quem nunca erra, é de quem nunca para de corrigir.',
  'Dias difíceis também contam. Principalmente eles.',
  'Hoje você entendeu algo que ontem derrubava você. Isso é evolução.',
  'Persistência é escolher de novo a meta toda manhã.',
  'Quem conhece os próprios erros não é pega de surpresa.',
  'Estudar cansada e mesmo assim estudar: é aí que nasce a aprovação.',
  'Um erro registrado é um erro que perdeu o poder de se repetir.',
  'A posse é o fim de muitos dias comuns em que você não desistiu.',
  'Não compare o seu capítulo 3 com o capítulo 20 de outra pessoa.',
  'Errar mostra onde estudar. Corrigir mostra que você está pronta.',
  'Disciplina é lembrar do que você quer mais do que do que você sente agora.',
  'Pequenos acertos somados viram uma classificação.',
  'Cada revisão deixa o conteúdo um pouco mais seu.',
  'A prova cobra o que você treinou. Treine o que você errou.',
  'Você está construindo uma versão sua que passa. Continue.',
  'Superar um erro antigo vale mais do que acertar uma questão fácil.',
  'O cansaço passa. A aprovação fica.',
  'Foco no processo: o resultado vem como consequência.',
  'Errou de novo? Ótimo. Agora você sabe exatamente o que revisar.',
  'Tudo o que hoje parece difícil já foi impossível um dia.',
];

const CHAVE = 'caderno-erros:ultima-mensagem';

/** Sorteia uma mensagem diferente da exibida na abertura anterior. */
export function sortearMensagem(): string {
  let anterior = -1;
  try { anterior = Number(localStorage.getItem(CHAVE) ?? -1); } catch { /* sem storage */ }
  let i = Math.floor(Math.random() * MENSAGENS.length);
  if (i === anterior) i = (i + 1 + Math.floor(Math.random() * (MENSAGENS.length - 1))) % MENSAGENS.length;
  try { localStorage.setItem(CHAVE, String(i)); } catch { /* sem storage */ }
  return MENSAGENS[i];
}
