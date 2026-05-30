# 📊 Sistema de Gestão Financeira e Comissões

Um sistema completo desenvolvido para controle de lançamentos de contratos, gestão de comissões em múltiplos níveis (Vendas Diretas, Representantes e Encarregadas) e relatórios financeiros automatizados. 

O projeto conta com níveis de acesso de segurança (perfil vendedor vs. perfil financeiro) e automação de alertas via Telegram.

## 🚀 Funcionalidades

* **Painel de Lançamentos:** Interface otimizada para os vendedores lançarem contratos, marcas, OS e valores bases, com bloqueio automático de edições de pagamento.
* **Módulo Financeiro:** Acesso restrito para contas autorizadas (ex: `financeiro@...`), liberando controle total sobre baixas, status de pagamento, formas de pagamento e datas.
* **Divisão de Comissões Inteligente:** Cálculo automatizado que divide a assessoria entre Venda Direta, Porcentagem de Representante e Porcentagem de Encarregada.
* **Geração de Relatórios (Excel e PDF):**
  * **Relatório de Comissões:** Exporta um arquivo Excel dividido em abas (Vendas, Liderança) contendo apenas os contratos faturados/pagos.
  * **Planilha Geral:** Exporta o consolidado geral do mês no padrão da empresa para conferência rápida de valores em aberto e pagos.
* **Automação de Servidor:** Infraestrutura com Node.js e PM2 configurada para inicialização autônoma ("Restore on AC Power Loss") e notificação de status em tempo real via **Bot do Telegram**.

## 🛠️ Tecnologias Utilizadas

* **Front-end:** React.js, React Router DOM, React Hot Toast (Notificações).
* **Back-end / Infra:** Node.js, PM2 (Gerenciamento de Processos).
* **Banco de Dados & Autenticação:** Firebase (Firestore & Auth).
* **Exportação de Dados:** biblioteca `xlsx` (para planilhas).
* **Integrações:** API Oficial do Telegram.
* **Hospedagem Front-end:** Netlify.

## ⚙️ Instalação e Execução (Local)

**1. Clone o repositório:**
\`\`\`bash
git clone https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
\`\`\`

**2. Instale as dependências (Front-end e Servidor):**
\`\`\`bash
npm install
\`\`\`

**3. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz do projeto com as credenciais do seu Bot do Telegram:
\`\`\`text
TELEGRAM_TOKEN=sua_chave_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
\`\`\`
*(Nota: O arquivo `.env` deve estar adicionado ao seu `.gitignore`).*

**4. Inicie a aplicação Front-end:**
\`\`\`bash
npm run dev
# ou npm start, dependendo do bundler (Vite/CRA)
\`\`\`

**5. Inicie o Servidor Autônomo com PM2:**
\`\`\`bash
pm2 start index.js --name "robo-comissoes"
pm2 save
\`\`\`

## 🔒 Segurança

Este repositório omite intencionalmente dados sensíveis, como o banco de dados principal do Firebase e tokens de APIs através de variáveis de ambiente. A regra de negócios prevê validação de e-mail logado diretamente no Front-end e Firestore Rules no Back-end.