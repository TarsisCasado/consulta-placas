import { google } from 'googleapis';

function limparPlaca(str) {
  return (str || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

function formatarData(val) {
  if (!val) return '';
  const str = val.toString().trim();
  if (str === '0' || str === '-' || str === '00/00/0000') return '';
  return str;
}

export default async function handler(req, res) {
  const { placa } = req.query;

  if (!placa) {
    return res.status(400).json({ erro: 'Por favor, informe a placa.' });
  }

  const placaBuscada = limparPlaca(placa);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1i2MRwE_u8yx8K3XExOUQM4Im_0m12LRaJncnttCaRTg';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'cartório!A1:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ erro: 'Nenhum dado encontrado na aba cartório.' });
    }

    // Localizar índices das colunas no cabeçalho
    let headerIndex = -1;
    let colEnvelope = 0;   // A
    let colPlaca = 1;      // B
    let colIda = 2;        // C
    let colVolta = 3;      // D
    let colDespachante = 4;// E

    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = (rows[i] || []).map(c => (c || '').toString().toUpperCase().trim());
      const pIdx = row.findIndex(c => c === 'PLACA');
      if (pIdx !== -1) {
        headerIndex = i;
        colPlaca = pIdx;
        
        const envIdx = row.findIndex(c => c.includes('ENVELOPE'));
        if (envIdx !== -1) colEnvelope = envIdx;

        const idaIdx = row.findIndex(c => c.includes('IDA'));
        if (idaIdx !== -1) colIda = idaIdx;

        const voltaIdx = row.findIndex(c => c.includes('VOLTA'));
        if (voltaIdx !== -1) colVolta = voltaIdx;

        const despIdx = row.findIndex(c => c.includes('DESPACHANTE'));
        if (despIdx !== -1) colDespachante = despIdx;

        break;
      }
    }

    const dataRows = headerIndex !== -1 ? rows.slice(headerIndex + 1) : rows;

    // Busca da última linha para a primeira (caso haja placa repetida, pega a mais recente)
    let match = null;
    for (let r = dataRows.length - 1; r >= 0; r--) {
      const placaLinha = limparPlaca(dataRows[r][colPlaca]);
      if (placaLinha === placaBuscada) {
        match = dataRows[r];
        break;
      }
    }

    if (!match) {
      return res.status(200).json({
        encontrado: false,
        status: 'Placa não localizada',
      });
    }

    const envelopeRecebido = formatarData(match[colEnvelope]);
    const dataIda = formatarData(match[colIda]);
    const dataVolta = formatarData(match[colVolta]);
    const enviadoDespachante = formatarData(match[colDespachante]);

    // Lógica da última etapa preenchida (da direita para a esquerda: E -> D -> C -> A)
    let ultimaEtapa = '';
    let ultimaData = '';
    let corStatus = 'pendente'; // 'sucesso' ou 'pendente'

    if (enviadoDespachante) {
      ultimaEtapa = 'Enviado ao Despachante';
      ultimaData = enviadoDespachante;
      corStatus = 'sucesso';
    } else if (dataVolta) {
      ultimaEtapa = 'Retornou do Cartório (Aguardando Despachante)';
      ultimaData = dataVolta;
      corStatus = 'sucesso';
    } else if (dataIda) {
      ultimaEtapa = 'Em andamento no Cartório (Ainda não retornou)';
      ultimaData = dataIda;
      corStatus = 'pendente';
    } else if (envelopeRecebido) {
      ultimaEtapa = 'Envelope Recebido (Aguardando Ida ao Cartório)';
      ultimaData = envelopeRecebido;
      corStatus = 'pendente';
    } else {
      ultimaEtapa = 'Sem movimentação registrada';
      ultimaData = '-';
      corStatus = 'pendente';
    }

    return res.status(200).json({
      encontrado: true,
      placa: (match[colPlaca] || '').toString().trim(),
      envelopeRecebido: envelopeRecebido || '-',
      dataIda: dataIda || '-',
      dataVolta: dataVolta || '-',
      enviadoDespachante: enviadoDespachante || '-',
      ultimaEtapa,
      ultimaData,
      corStatus
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao consultar planilha: ' + error.message });
  }
}
