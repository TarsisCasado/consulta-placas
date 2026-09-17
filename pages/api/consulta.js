import { google } from 'googleapis';

function limparPlaca(str) {
  return (str || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

function formatarData(val) {
  if (!val) return '';
  return val.toString().trim();
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

    let headerIndex = -1;
    let colPlaca = 1;
    let colIda = 2;
    let colVolta = 3;

    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = (rows[i] || []).map(c => (c || '').toString().toUpperCase().trim());
      const pIdx = row.findIndex(c => c === 'PLACA');
      if (pIdx !== -1) {
        headerIndex = i;
        colPlaca = pIdx;
        colIda = row.findIndex(c => c.includes('IDA'));
        colVolta = row.findIndex(c => c.includes('VOLTA'));
        break;
      }
    }

    const dataRows = headerIndex !== -1 ? rows.slice(headerIndex + 1) : rows;

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

    const dataIda = formatarData(match[colIda]);
    const dataVolta = formatarData(match[colVolta]);

    const estaPendente = !dataVolta || dataVolta === '0' || dataVolta === '-' || dataVolta.includes('00/00');

    return res.status(200).json({
      encontrado: true,
      placa: (match[colPlaca] || '').toString().trim(),
      dataIda: dataIda || '-',
      dataVolta: estaPendente ? '-' : dataVolta,
      status: estaPendente ? 'Processo ainda não voltou do cartório' : 'Processo devolvido do cartório',
      estaPendente,
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao consultar planilha: ' + error.message });
  }
}
