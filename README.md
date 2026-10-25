# Enquete da live: 13 ou 22

Aplicação local para exibir uma enquete informal durante uma live pública do TikTok. O painel lê os comentários e atualiza a tela do overlay quando alguém comenta exatamente `13` ou `22`.

> Isso conta opiniões no chat. Não registra votos eleitorais nem se conecta à urna oficial.

## Como iniciar

1. Instale Node.js 20 ou superior.
2. Baixe/clonar este repositório e abra a pasta do projeto no terminal.
3. Execute `npm install` e depois `npm start`.
4. Acesse `http://127.0.0.1:3000/admin`.
5. Digite o @usuário da conta que está ao vivo e clique em **Conectar à live**.
6. Abra `http://127.0.0.1:3000/overlay` em outra janela e capture essa janela na ferramenta de transmissão.

## Contagem

- Só entram comentários cujo texto inteiro seja `13` ou `22`.
- Cada pessoa conta uma vez. Se mudar de opção, a contagem acompanha a última escolha.
- Clique em **Zerar enquete** para iniciar uma nova contagem.
- O placar fica apenas na memória enquanto o servidor estiver aberto. O app não guarda comentários ou nomes.
- A conexão padrão aceita somente acesso no próprio computador (`127.0.0.1`).

## Sobre a conexão com o TikTok

A leitura do chat usa [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector), um projeto comunitário não oficial e sem vínculo com o TikTok/ByteDance. Ele pode deixar de funcionar se o TikTok alterar o protocolo. Use apenas para uma live pública que você esteja autorizado a acompanhar; não inclui envio automático de mensagens.
