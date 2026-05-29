const admin = require('firebase-admin');
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');
const PDFDocument = require('pdfkit');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Pasta principal
const dir = './arquivos_salvos';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// ---------------------------------------------------------
// NOVA FUNÇÃO: DESCOBRIR O MÊS E CRIAR A PASTA
// ---------------------------------------------------------
function obterPastaDoMes() {
  const data = new Date();
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  const nomeMes = meses[data.getMonth()];
  const ano = data.getFullYear();
  const nomeDaPasta = `${nomeMes}-${ano}`; // Ex: maio-2026
  
  const caminhoCompleto = path.join(dir, nomeDaPasta);

  // Se a pasta do mês ainda não existir, o robô cria na hora
  if (!fs.existsSync(caminhoCompleto)) {
    fs.mkdirSync(caminhoCompleto);
  }
  
  return caminhoCompleto;
}

// ---------------------------------------------------------
// FUNÇÃO 1: BACKUP DIÁRIO (JSON)
// ---------------------------------------------------------
async function fazerBackup() {
  console.log('A iniciar o backup diário...');
  try {
    const snapshot = await db.collection('lancamentos').get(); 
    const todosContratos = [];
    snapshot.forEach((doc) => {
      todosContratos.push({ id: doc.id, ...doc.data() });
    });

    const pastaDestino = obterPastaDoMes(); // Chama a inteligência de pastas
    const dataHoje = new Date().toISOString().split('T')[0]; 
    const caminhoArquivo = path.join(pastaDestino, `backup_diario_${dataHoje}.json`);

    fs.writeFileSync(caminhoArquivo, JSON.stringify(todosContratos, null, 2));
    console.log(`✅ Backup guardado na pasta ${pastaDestino}`);
  } catch (erro) {
    console.error('❌ Erro no backup diário:', erro);
  }
}

// ---------------------------------------------------------
// FUNÇÃO 2: FECHAMENTO MENSAL (ESTILO SISTEMA WEB)
// ---------------------------------------------------------
async function fazerFechamentoMensal() {
  console.log('A gerar o fechamento mensal...');
  try {
    const snapshot = await db.collection('lancamentos').get();
    
    const pastaDestino = obterPastaDoMes(); // Chama a inteligência de pastas
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

  } catch (erro) {
    console.error('❌ Erro ao gerar o PDF:', erro);
  }
}

// ---------------------------------------------------------
// RELÓGIOS
// ---------------------------------------------------------
cron.schedule('59 23 * * *', () => {
  fazerBackup();
});

cron.schedule('0 0 1 * *', () => {
  fazerFechamentoMensal();
});

// fazerBackup();
// fazerFechamentoMensal();