# Matemática adaptativa

O fluxo do motor é:

```text
Fact → Scheduler → Question → Distractors → Attempt → Hint → Outcome → Mastery Update → Spacing
```

## Fact

`MultiplicationFact` representa `a × b`, com fatores inteiros de 1 a 10 e resposta calculada. A chave de persistência é `a x b`; a chave comutativa ordena os fatores para permitir transferência entre `7 × 8` e `8 × 7`.

As bandas internas são A (`1, 2`), B (`3, 4`), C (`6`), D (`7, 8, 9`) e E (`10` e mistura). A criança nunca vê esses nomes como fases.

## Distratores

`generateAlternatives` sempre retorna três valores únicos e uma única resposta correta. As alternativas erradas priorizam:

- fatos quadrados, como `6 × 6` e `7 × 7`;
- fatos vizinhos;
- multiplicador adjacente;
- soma parecida;
- confusão entre quantidade e preço;
- fallback apenas quando necessário.

## Pistas

| Nível | Comportamento                                |
| ----- | -------------------------------------------- |
| 0     | nenhuma ajuda extra                          |
| 1     | lembra quantidade e preço                    |
| 2     | mostra produtos e preço unitário             |
| 3     | mostra soma repetida                         |
| 4     | mostra a relação completa e permite concluir |

Erros não retiram dinheiro, XP ou progresso. O sistema registra o distrator selecionado e a profundidade da pista para adaptar exposições futuras.

## Domínio

Valores atuais, centralizados em `mastery.ts`:

- acerto independente: `+0.18`;
- acerto após pista contextual: `+0.10`;
- acerto após representação concreta: `+0.06`;
- acerto após soma repetida: `+0.03`;
- solução mostrada: `+0`;
- erro: `-0.03`;
- clamp: `0..1`.

Estados:

- `new`: nenhuma exposição positiva;
- `learning`: domínio abaixo de `0.45`;
- `consolidating`: domínio entre `0.45` e `0.75`;
- `mastered`: domínio de pelo menos `0.75`, três acertos independentes e prática em dois dias.

## Scheduler

Fatos novos têm prioridade. Fatos em consolidação recebem pontuação conforme domínio e dias desde a última exposição. Fatos dominados só retornam quando a janela espaçada vence. Empates usam a seed da sessão.

No início de cada visita, `createDaySession` consulta o `mathProgress` persistido no perfil e transforma o fato escolhido em uma situação de quantidade × preço sempre que houver produto compatível na loja. Quando nenhum fator está disponível como preço, a sessão mantém a seleção contextual determinística como fallback. A criança não vê pontuação, estado ou a seed do scheduler.
