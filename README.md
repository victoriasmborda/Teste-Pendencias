# Pendências da Equipe

Interface simples e compartilhada para a equipe organizar pendências:
criar, editar, indicar status e prazo (quando aplicável). Não precisa de
servidor próprio — usa uma Google Sheet como banco de dados (via Google
Apps Script) e um site estático (`index.html`) que todo mundo acessa pelo
mesmo link.

## Como funciona

- `apps-script/Code.gs` roda dentro do Google Apps Script, ligado a uma
  Google Sheet, e expõe uma API (GET para listar, POST para
  criar/editar/excluir).
- `index.html` é a interface: uma página só, sem build, que qualquer
  colega abre no navegador e usa para ver/criar/editar pendências.
- Não há login: todos usam o mesmo link. Cada pessoa informa seu nome uma
  vez (fica salvo no navegador) para aparecer como responsável/editor.

## Passo a passo (uma pessoa configura, ~5 minutos)

### 1. Criar a planilha
1. Crie uma nova Google Sheet em https://sheets.new
2. Não precisa criar colunas manualmente — o script cria o cabeçalho
   sozinho na primeira chamada.

### 2. Configurar o Apps Script
1. Na planilha, vá em **Extensões > Apps Script**.
2. Apague o conteúdo padrão de `Code.gs` e cole o conteúdo do arquivo
   [`apps-script/Code.gs`](apps-script/Code.gs) deste repositório.
3. Salve (ícone de disquete).

### 3. Implantar como Web App
1. Clique em **Implantar > Nova implantação**.
2. Tipo: **App da Web**.
3. Configuração:
   - **Executar como:** Eu (sua conta)
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar** e autorize as permissões solicitadas.
5. Copie a **URL do app da Web** gerada (algo como
   `https://script.google.com/macros/s/AKfycb.../exec`).

> Sempre que você editar o `Code.gs`, é preciso criar uma **nova
> implantação** (ou usar "Gerenciar implantações > editar" para atualizar
> a mesma URL).

### 4. Publicar a interface
Publique `index.html` em algum lugar acessível pela equipe. Opções:

- **GitHub Pages** (recomendado, grátis): em Settings > Pages do
  repositório, habilite Pages a partir da branch `main`. O link será algo
  como `https://<usuario>.github.io/Teste-Pendencias/`.
- Ou simplesmente compartilhe o arquivo `index.html` (cada pessoa abre
  localmente) — funciona, mas é menos prático de compartilhar link.

### 5. Configurar a conexão
1. Abra o link publicado.
2. Na primeira tela, cole a **URL do Apps Script** copiada no passo 3 e
   informe seu nome.
3. Pronto — pode compartilhar o mesmo link com os colegas. Cada um cola a
   mesma URL do Apps Script e o próprio nome na primeira vez que abrir.

## Uso

- **+ Nova pendência**: título, descrição, responsável, status (Pendente,
  Em andamento, Concluído, Cancelado) e prazo opcional.
- Cartões com prazo vencido ficam destacados em vermelho; prazos nos
  próximos 3 dias ficam em amarelo.
- Filtro por status e busca por texto no topo.
- A lista atualiza sozinha a cada 15s, e também pode ser atualizada na
  hora pelo botão **↻ Atualizar**.
- **⚙ Configurações** permite trocar a URL do Apps Script ou seu nome.

## Limitações conhecidas

- Sem autenticação: qualquer pessoa com o link do Apps Script pode ler e
  escrever. Adequado para uso interno de confiança entre colegas.
- Não há atualização em tempo real "instantânea" entre pessoas (apenas
  polling a cada 15s) — para o caso de uso de pendências de equipe, isso
  é suficiente.
- O Apps Script tem cotas de uso do Google (bem generosas para uso de
  equipe pequena/média).
