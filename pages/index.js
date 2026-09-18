import { useState } from 'react';

export default function Home() {
  const [placa, setPlaca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const buscar = async (e) => {
    e.preventDefault();
    if (!placa.trim()) return;

    setCarregando(true);
    setResultado(null);

    try {
      const res = await fetch(`/api/consulta?placa=${encodeURIComponent(placa)}`);
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setResultado({ erro: 'Erro ao conectar ao servidor.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 1.5rem 0', color: '#38bdf8', fontSize: '1.4rem' }}>
          Consulta de Processos
        </h2>

        <form onSubmit={buscar}>
          <input
            type="text"
            placeholder="Digite a placa (ex: POY3050)"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '1.15rem', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold' }}
          />
          <button
            type="submit"
            disabled={carregando}
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem', borderRadius: '10px', border: 'none', background: '#0284c7', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {carregando ? 'Consultando...' : 'Buscar Placa'}
          </button>
        </form>

        {resultado && (
          <div style={{ marginTop: '1.5rem', padding: '1.2rem', borderRadius: '12px', background: resultado.erro || !resultado.encontrado ? '#450a0a' : (resultado.corStatus === 'sucesso' ? '#064e3b' : '#451a03'), border: '1px solid rgba(255,255,255,0.1)' }}>
            {resultado.erro && (
              <p style={{ margin: 0, color: '#fca5a5', textAlign: 'center', fontWeight: '500' }}>{resultado.erro}</p>
            )}

            {!resultado.encontrado && !resultado.erro && (
              <p style={{ margin: 0, color: '#fca5a5', textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem' }}>
                {resultado.status}
              </p>
            )}

            {resultado.encontrado && (
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.9rem', color: '#fff', letterSpacing: '1px' }}>
                  {resultado.placa}
                </div>

                {/* Histórico das 4 etapas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>1. Envelope Recebido:</span>
                  <span style={{ fontWeight: '600' }}>{resultado.envelopeRecebido}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>2. Ida Cartório:</span>
                  <span style={{ fontWeight: '600' }}>{resultado.dataIda}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>3. Volta Cartório:</span>
                  <span style={{ fontWeight: '600' }}>{resultado.dataVolta}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>4. Enviado Despachante:</span>
                  <span style={{ fontWeight: '600' }}>{resultado.enviadoDespachante}</span>
                </div>

                {/* Destaque da Última Movimentação */}
                <div style={{ marginTop: '1.1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '0.2rem' }}>
                    Última Atualização
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: resultado.corStatus === 'sucesso' ? '#6ee7b7' : '#fdba74' }}>
                    {resultado.ultimaEtapa}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                    Data: <strong>{resultado.ultimaData}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
