# 🤖 Automator & Backup Server (Node.js)

Este é um microsserviço de backend desenvolvido para atuar em conjunto com o Sistema de Comissões web. Ele roda como um serviço de background contínuo (Daemon) em um servidor local, automatizando as rotinas de segurança e fechamento contábil da empresa.

## 🚀 O que este robô faz?

O sistema possui duas rotinas agendadas via **Cron Jobs**:
1. **Rotina Diária (Backup em tempo real):** Todos os dias, às 23h59, o robô se conecta ao Firebase, extrai todos os lançamentos do dia e gera um arquivo `.json`. Isso garante que haja um backup físico local à prova de falhas na nuvem.
2. **Rotina Mensal (Fechamento Financeiro):** No dia 1º de cada mês, à meia-noite, o sistema consolida as vendas dos últimos 30 dias, processa os valores e gera automaticamente um relatório **PDF** formatado (Estilo Tabela) com o cálculo final das comissões.

## 🧠 Inteligência de Armazenamento
O código possui um sistema de roteamento de arquivos (File System) que identifica o mês/ano atual no momento da execução e cria pastas organizadoras automaticamente (ex: `maio-2026/`), salvando os backups e PDFs nas suas respectivas competências contábeis.

## 🛠️ Tecnologias Utilizadas
- **Node.js**: Ambiente de execução.
- **Firebase Admin SDK**: Conexão com privilégios de servidor ao banco NoSQL.
- **Node-Cron**: Agendamento de tarefas no estilo Linux/Unix.
- **PDFKit**: Geração dinâmica do relatório em PDF.
- **PM2**: Gerenciador de processos (Process Manager) utilizado para manter a aplicação viva 24/7 de forma invisível no servidor, com reinicialização automática em caso de queda de energia.

## 🔒 Segurança
As credenciais de acesso ao Firebase (Chave Mestra) e os dados exportados dos clientes (`arquivos_salvos/`) estão no `.gitignore` para garantir o total sigilo das informações da empresa.