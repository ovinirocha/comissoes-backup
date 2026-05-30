# 🤖 Servidor Autônomo de Backups e Relatórios

Este repositório contém o código do **Background Worker** (Servidor de Bastidores) do Sistema de Comissões. Ele foi desenvolvido em Node.js para rodar de forma invisível e autônoma em um servidor Windows físico, sendo gerenciado pelo PM2.

Sua função principal é monitorar o banco de dados (Firebase Firestore), gerar backups locais diários, criar relatórios em PDF mensalmente e enviar notificações em tempo real via Telegram.

## 🚀 Funcionalidades (O que o Robô faz)

* **Backup Diário Automático (JSON):** Todos os dias às 23h59, o robô faz a leitura completa do Firestore e salva um espelho dos dados na máquina local.
* **Fechamento Mensal Automático (PDF):** No dia 1º de cada mês, à meia-noite, o sistema desenha um PDF formatado com todas as movimentações do mês e o total faturado.
* **Organização Inteligente:** O código cria pastas locais automaticamente baseadas no mês e ano vigentes (ex: `maio-2026`) para armazenar os arquivos.
* **Bot Interativo do Telegram:** * Avisa o administrador sempre que o servidor liga.
  * Notifica quando os backups e PDFs são gerados com sucesso (ou se houver falhas).
  * Responde a comandos ao vivo (como `/status`) para checagem rápida de saúde do servidor (Heartbeat).
* **Resiliência de Infraestrutura:** Configurado via PM2 para iniciar automaticamente junto com o Windows ("Restore on AC Power Loss"), sobrevivendo a quedas de energia e reinicializações sem intervenção humana.

## 🛠️ Tecnologias Utilizadas

* **Runtime:** Node.js
* **Process Manager:** PM2
* **Banco de Dados:** Firebase Admin SDK (Firestore)
* **Agendamento:** node-cron
* **Geração de Documentos:** PDFKit
* **Notificações:** node-telegram-bot-api

## ⚙️ Instalação e Execução

**1. Clone o repositório:**
```bash
git clone [https://github.com/ovinirocha/comissoes-backup.git](https://github.com/ovinirocha/comissoes-backup.git)
```

**2. Instale as dependências:**
```bash
npm install
```

**3. Configure as Variáveis de Ambiente e Chaves:**
Crie um arquivo `.env` na raiz do projeto com as credenciais do Bot do Telegram:
```text
TELEGRAM_TOKEN=sua_chave_do_botfather
TELEGRAM_CHAT_ID=seu_chat_id
```
Coloque também o seu arquivo de credenciais do Firebase (`serviceAccountKey.json`) na raiz do projeto.

**4. Oculte as Chaves (Muito Importante):**
Certifique-se de que o seu arquivo `.gitignore` possui as seguintes linhas para não vazar os dados no GitHub:
```text
node_modules/
.env
serviceAccountKey.json
arquivos_salvos/
```

**5. Inicie o Servidor Autônomo com PM2:**
Para garantir que o script rode em segundo plano e inicie com o Windows:
```bash
pm2 start index.js --name "robo-comissoes"
pm2 save
pm2-startup install
```

## 📡 Monitoramento

Para verificar os logs de execução do robô ao vivo no servidor local, utilize:
```bash
pm2 logs robo-comissoes
```
Para consultar o status do robô remotamente pelo celular, envie a mensagem `/status` para o bot no Telegram.
