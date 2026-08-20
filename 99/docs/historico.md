# Histórico de commits

Registro do que cada commit da fase de iterações 9A–9M contém. Os commits
`feat(general): work in progress` vieram de uma janela de trabalho contínua e
não descrevem bem o conteúdo; este documento é o mapa oficial para auditoria.

## Mapa dos commits

| Commit | Fase(s) | Conteúdo principal |
| --- | --- | --- |
| `6ada84d` | 9A–9D | Juice (som/partículas/tremor), mundo vivo (fauna/vento/pet), eventos diários, aconchego (luzes/quintal) |
| `914eac4` | 9E–9H | Persistência de construções/relógio, menu de configurações, construção com desafio, itens no chão |
| `e21cc0d` | 9I–9J | Unicórnio/dinossauro de ambiente, UI mobile sem sobreposição |
| `2aad2f8` | 9K | Rostos low-poly e acessórios por NPC |
| `bef42f5` | 9L | Minimapa das seis regiões |
| `e856ad9` | 9M | Céu estrelado, lua e noite envolvente |

## Política daqui em diante

- **Commits por fase/assunto**, com mensagem `feat(99): <o que mudou>`.
- **Nada de `work in progress`** em `main`: cada entrega validada (CI + E2E)
  entra como um commit único e legível.
