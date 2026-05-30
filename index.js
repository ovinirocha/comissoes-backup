require('dotenv').config(); // Puxa os dados do arquivo .env
const admin = require('firebase-admin');
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');
const PDFDocument = require('pdfkit');
const TelegramBot = require('node-telegram-bot-api'); // Nossa nova biblioteca interativa

// ---------------------------------------------------------
// 1. CONFIGURAÇÃO DO ROBÔ DO TELEGRAM
// ---------------------------------------------------------
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// O {polling: true} é o superpoder que faz ele ler suas mensagens
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Avisa assim que o PC ligar ou o PM2 reiniciar
bot.sendMessage(TELEGRAM_CHAT_ID, "🤖 Fala, chefe! O servidor de Comissões ligou e estou aguardando seus comandos. Digite /status para testar.");

// O robô responde ao comando /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "✅ Tudo 100% online por aqui! PM2 rodando liso e bancos de dados conectados.");
});

// O robô conversa com você
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text ? msg.text.toLowerCase() : '';

  if (texto.startsWith('/')) return; // Pula os comandos com barra

  if (texto.includes('oi') || texto.includes('olá')) {
    bot.sendMessage(chatId, `Olá, ${msg.from.first_name}! O financeiro está sob controle. 🚀`);
  }
});


// ---------------------------------------------------------
// 2. CONFIGURAÇÃO DO FIREBASE (BANCO DE DADOS)
// ---------------------------------------------------------
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();


// ---------------------------------------------------------
// 3. INTELIGÊNCIA DE PASTAS E ARQUIVOS
// ---------------------------------------------------------
const dir = './arquivos_salvos';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

function obterPastaDoMes() {
  const data = new Date();
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  const nomeMes = meses[data.getMonth()];
  const ano = data.getFullYear();
  const nomeDaPasta = `${nomeMes}-${ano}`; 
  
  const caminhoCompleto = path.join(dir, nomeDaPasta);

  if (!fs.existsSync(caminhoCompleto)) {
    fs.mkdirSync(caminhoCompleto);
  }
  return caminhoCompleto;
}


// ---------------------------------------------------------
// 4. FUNÇÃO DE BACKUP DIÁRIO (JSON)
// ---------------------------------------------------------
async function fazerBackup() {
  console.log('A iniciar o backup diário...');
  try {
    const snapshot = await db.collection('lancamentos').get(); 
    const todosContratos = [];
    snapshot.forEach((doc) => {
      todosContratos.push({ id: doc.id, ...doc.data() });
    });

    const pastaDestino = obterPastaDoMes(); 
    const dataHoje = new Date().toISOString().split('T')[0]; 
    const caminhoArquivo = path.join(pastaDestino, `backup_diario_${dataHoje}.json`);

    fs.writeFileSync(caminhoArquivo, JSON.stringify(todosContratos, null, 2));
    console.log(`✅ Backup guardado na pasta ${pastaDestino}`);
    
    // O robô avisa no seu Telegram que o backup foi feito!
    bot.sendMessage(TELEGRAM_CHAT_ID, `💾 Chefe, acabei de realizar o backup diário com sucesso na pasta: ${nomeDaPasta}`);

  } catch (erro) {
    console.error('❌ Erro no backup diário:', erro);
    bot.sendMessage(TELEGRAM_CHAT_ID, `⚠️ Chefe, deu algum erro na hora de fazer o backup diário!`);
  }
}


// ---------------------------------------------------------
// 5. FECHAMENTO MENSAL (PDF)
// ---------------------------------------------------------
async function fazerFechamentoMensal() {
  console.log('A gerar o fechamento mensal...');
  try {
    const snapshot = await db.collection('lancamentos').get();
    
    const pastaDestino = obterPastaDoMes(); 
    const dataMes = new Date().toISOString().substring(0, 7); 
    const caminhoPDF = path.join(pastaDestino, `fechamento_${dataMes}.pdf`);
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(fs.createWriteStream(caminhoPDF));

    doc.rect(0, 0, 600, 80).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('SISTEMA DE COMISSÕES', 50, 25);
    doc.fontSize(10).font('Helvetica').text(`Fechamento da Competência | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 50, 50);

    const colVendedor = 50;
    const colContrato = 260;
    const colMarca = 350;
    const colValor = 460;
    let eixoY = 120; 

    doc.rect(50, eixoY, 495, 20).fill('#F1F5F9'); 
    doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold');
    doc.text('VENDEDOR', colVendedor + 5, eixoY + 5);
    doc.text('CONTRATO', colContrato, eixoY + 5);
    doc.text('MARCA', colMarca, eixoY + 5);
    doc.text('VALOR', colValor, eixoY + 5, { width: 85, align: 'right' });

    eixoY += 25;
    doc.font('Helvetica'); 

    let totalGeral = 0;
    let linhaPar = false;

    snapshot.forEach((docSnap) => {
      const lancamento = docSnap.data();
      const nomeVendedor = lancamento.vendedor || 'Sem Nome';
      const valor = parseFloat(lancamento.valorAssessoria) || 0;
      const numContrato = lancamento.contrato || 'S/N';
      const marca = lancamento.marca || 'N/D';

      if (eixoY > 750) {
        doc.addPage();
        eixoY = 50; 
      }

      if (linhaPar) {
        doc.rect(50, eixoY - 5, 495, 20).fill('#F8FAFC');
      }
      linhaPar = !linhaPar;

      doc.fillColor('#334155').fontSize(10);
      doc.text(nomeVendedor.substring(0, 30), colVendedor + 5, eixoY); 
      doc.text(numContrato, colContrato, eixoY);
      doc.text(marca, colMarca, eixoY);
      doc.fillColor('#059669').font('Helvetica-Bold').text(`R$ ${valor.toFixed(2)}`, colValor, eixoY, { width: 85, align: 'right' });
      doc.font('Helvetica'); 

      eixoY += 20;
      totalGeral += valor;
    });

    eixoY += 10;
    doc.moveTo(50, eixoY).lineTo(545, eixoY).strokeColor('#CBD5E1').stroke();
    eixoY += 15;

    doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL MOVIMENTADO:', 250, eixoY, { width: 200, align: 'right' });
    
    doc.fillColor('#059669').fontSize(14);
    doc.text(`R$ ${totalGeral.toFixed(2)}`, colValor, eixoY - 2, { width: 85, align: 'right' });

    doc.end();
    console.log(`📄 PDF de fechamento salvo na pasta ${pastaDestino}`);

    // O robô avisa no seu Telegram que o PDF do mês foi criado!
    bot.sendMessage(TELEGRAM_CHAT_ID, `📊 Chefe, o PDF de Fechamento Mensal já foi gerado e salvo no servidor! Total movimentado: R$ ${totalGeral.toFixed(2)}`);

  } catch (erro) {
    console.error('❌ Erro ao gerar o PDF:', erro);
    bot.sendMessage(TELEGRAM_CHAT_ID, `⚠️ Chefe, deu erro na hora de gerar o PDF de fechamento mensal!`);
  }
}


// ---------------------------------------------------------
// 6. RELÓGIOS (AGENDAMENTOS CRON)
// ---------------------------------------------------------
// Roda todo dia às 23:59
cron.schedule('59 23 * * *', () => {
  fazerBackup();
});

// Roda todo dia 1º de cada mês à meia-noite
cron.schedule('0 0 1 * *', () => {
  fazerFechamentoMensal();
});