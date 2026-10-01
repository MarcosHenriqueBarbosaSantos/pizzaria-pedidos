# Site de pedidos da pizzaria

Três páginas que usam o mesmo banco de dados (Supabase, projeto "Pizzaria Pedidos"):

| Página | Para quem | O que faz |
|---|---|---|
| `index.html` | Cliente | Cardápio, promoções, pedido, acompanhamento e botão de WhatsApp |
| `cozinha.html` | Cozinha (com login) | Pedidos na hora, aviso sonoro, avanço de status e impressão da comanda |
| `gestor.html` | Gestor (com login) | Vendas por dia, semana e mês, custos, lucro, promoções, equipe e QR de avaliação |

## 1. Preparar o banco (uma vez)

1. Entre em supabase.com e abra o projeto **Pizzaria Pedidos**.
2. Abra **SQL Editor**, cole todo o conteúdo de `schema.sql` e clique em **Run**.

## 2. Publicar no GitHub Pages

1. No GitHub, crie um repositório público (por exemplo `pizzaria-pedidos`).
2. Em **Add file → Upload files**, envie todos os arquivos desta pasta e confirme.
3. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. Em um ou dois minutos o site abre em `https://SEU-USUARIO.github.io/pizzaria-pedidos/`.

## 3. Ligar o login ao endereço do site

No Supabase, em **Authentication → URL Configuration**:

- **Site URL:** o endereço do passo 2.
- **Redirect URLs:** adicione o mesmo endereço terminado em `/gestor.html` e em `/cozinha.html`.

Sem isso, o link de confirmação do e-mail leva para um endereço que não existe.

## 4. Primeiro acesso

1. Abra `gestor.html`, preencha e-mail e senha e clique em **Primeiro acesso: criar minha senha**.
2. Confirme pelo link que chega no e-mail e volte para entrar.
3. O primeiro acesso criado vira o **gestor**. Faça isso antes de divulgar o site.
4. Quem trabalha na cozinha cria o próprio acesso em `cozinha.html`. Depois o gestor libera o e-mail em **Equipe e acessos**.

## 5. Impressão na cozinha

- Escolha o formato na tela da cozinha: cupom de 80 mm, cupom de 58 mm ou folha comum.
- Com **Imprimir pedido novo sozinho** ligado, cada pedido novo abre a impressão.
- Para imprimir sem a janela de confirmação, abra o Chrome da cozinha com a opção `--kiosk-printing` e deixe a impressora da cozinha como padrão.
- O aviso sonoro só toca depois do primeiro clique na página (regra dos navegadores).

## 6. O que ajustar nos arquivos

- `comum.js`: WhatsApp da pizzaria (`WHATS`), taxa de entrega, pedido mínimo, cardápio, preços, bordas e promoções.
- `gestor.html` → **Custos e ficha técnica**: os custos vêm com valores de exemplo; troque pelos reais.

## Limites desta versão

- **O total é calculado no navegador do cliente.** A cozinha deve conferir o valor antes de cobrar. A conferência de preços no servidor é o próximo passo.
- **Cashback e cupons ficam no aparelho do cliente** e não são conferidos pelo banco.
- **Sem login de cliente:** o acompanhamento do pedido funciona no aparelho em que o pedido foi feito.
- **Plano gratuito do Supabase:** o projeto pode ser pausado depois de cerca de uma semana sem uso; basta reativar no painel.
- **WhatsApp:** nada é enviado sozinho. O cliente toca no botão para mandar o pedido ao WhatsApp da pizzaria.
