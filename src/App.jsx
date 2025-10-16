// src/App.jsx
import './index.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

/* ------------------ Kalıcı Filo Store (localStorage) ------------------ */
const STORE_KEY = 'logi:fleet:v1';
const OFFSET_RATE = 0.40; // %40 offset

// Tür ve yakıta göre emisyon katsayıları (ton CO2 / ay varsayım)
const TYPE_BASE = {
  Truck: 5.8, Van: 2.1, Car: 0.8, Courier: 1.2, Tractor: 3.5,
  Kamyon: 6.0, Tır: 6.5, Binek: 0.9, 'Motosiklet Kurye': 0.45, Traktör: 3.5,
};
const FUEL_MULT = { Diesel: 1.0, Dizel: 1.0, Benzin: 0.85, Gasoline: 0.85, Electric: 0 };

const r2 = (n) => Math.round(n * 100) / 100;

function estimateEmission(v) {
  const vt = v.vehicleType ?? v.type;
  const base = TYPE_BASE[vt] ?? 1.0;
  const mult = FUEL_MULT[v.fuelType] ?? 1.0;
  return r2(base * mult);
}
function dedupeByUTTS(arr) {
  const seen = new Set();
  return arr.filter((x) => {
    const key = (x.utts || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function loadFleetLS() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveFleetLS(arr) {
  localStorage.setItem(STORE_KEY, JSON.stringify(dedupeByUTTS(arr)));
}

/* ------------------ Uygulama ------------------ */
export default function App() {
  // Sol menü sekmesi
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'fleet' | 'emissions' | 'charts'

  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div className="header-title">KarbonFilo</div>
        <div className="header-user">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
          </svg>
          <span>LogiNova</span>
        </div>
      </div>

      {/* BODY */}
      <div className="body">
        {/* LEFT BAR */}
        <div className="left-bar">
          <div className="menu">
            <div
              className={`menu-item ${tab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setTab('dashboard')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              <span>Genel Görünüm</span>
            </div>

            <div
              className={`menu-item ${tab === 'fleet' ? 'active' : ''}`}
              onClick={() => setTab('fleet')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 13h18l-2-5h-3V4H8v4H5l-2 5zm16 1H5v4h14v-4z" />
              </svg>
              <span>Filo Yönetimi</span>
            </div>

            <div
              className={`menu-item ${tab === 'emissions' ? 'active' : ''}`}
              onClick={() => setTab('emissions')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M3 17h2v-7H3v7zm4 0h2v-4H7v4zm4 0h2v-10h-2v10zm4 0h2v-6h-2v6zm4 0h2v-2h-2v2z" />
              </svg>
              <span>Emisyon Analizi</span>
            </div>

            <div
              className={`menu-item ${tab === 'charts' ? 'active' : ''}`}
              onClick={() => setTab('charts')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M5 3v18h14v-2H7V3H5zm6 8v8h2v-8h-2zm4-4v12h2V7h-2zM9 13v3h2v-3H9z" />
              </svg>
              <span>Grafikler</span>
            </div>
          </div>

          <div className="left-footer">LogiNova — Tüm Hakları Saklıdır © 2025</div>
        </div>

<div className="main">
  {tab === 'dashboard' && <Dashboard />}   {/* <-- büyük harf */}
  {tab === 'fleet' && <FleetPage />}
  {tab === 'emissions' && <EmissionsPage />}
  {tab === 'charts' && <ChartPage />}
</div>
      </div>
    </>
  );
}
function Dashboard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [err, setErr] = useState('');

  // Fleet verisini LS'ten oku (App.jsx'deki loadFleetLS fonksiyonunu kullanıyoruz)
  const fleet = loadFleetLS();

  // Basit KPI’lar
  const totalEmissions = r2(fleet.reduce((s, v) => s + (v.emissions ?? estimateEmission(v)), 0));
  const totalOffset = r2(totalEmissions * OFFSET_RATE);
  const net = r2(totalEmissions - totalOffset);

  // Prompt’u derle
  const buildPrompt = () => {
    const lines = [
      `Şirketin filo karbon özeti (aylık varsayım):`,
      `- Toplam Emisyon: ${totalEmissions} ton CO₂`,
      `- Karbon Dengeleme (~%${Math.round(OFFSET_RATE * 100)}): ${totalOffset} ton CO₂`,
      `- Net: ${net} ton CO₂`,
      ``,
      `Araç ayrıntıları (plaka | tür | yakıt | depo | emisyon):`,
    ];

    fleet.forEach(v => {
      const e = v.emissions ?? estimateEmission(v);
      lines.push(`• ${v.plate} | ${v.vehicleType} | ${v.fuelType} | ${v.tankAmount} | ${e} ton CO₂`);
    });

    lines.push(
      ``,
      `Bu verilere göre 5 maddelik kısa bir analiz ve 3 aksiyon önerisi çıkar; net, somut, Türkçe ve işletme odaklı yaz.`
    );

    return lines.join('\n');
  };

  // OpenAI çağrısı
  const runAI = async () => {
    setLoading(true);
    setErr('');
    setAnswer('');
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // .env
      if (!apiKey) throw new Error('API anahtarı yok (VITE_OPENAI_API_KEY).');

      const prompt = buildPrompt();

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Kısa, açık ve uygulanabilir içgörüler ver.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      setAnswer(content.trim());
    } catch (e) {
      setErr(e.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    // modal açılır açılmaz otomatik prompt gönder
    runAI();
  };

  return (
    <div className="dashboard-grid">
      {/* Sol kutu: Sponsorlar */}

      {/* Sağ kutu: AI Analiz */}
      <div className="ai-section">
        <div className="ai-header">
          <h2>AI Filo Yorumu</h2>
          <button className="ai-button" onClick={handleOpen}>AI yorumunu al</button>
        </div>

        <p className="ai-hint">
          Tek tıkla, filonun mevcut verilerinden kısa bir analiz ve aksiyon önerileri alın.
        </p>
      </div>

      {/* Modal */}
      {open && (
        <div className="ai-modal-overlay" onClick={() => setOpen(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h3>AI Analiz</h3>
              <button className="ai-close" onClick={() => setOpen(false)} aria-label="Kapat">✕</button>
            </div>

            <div className="ai-modal-body">
              {loading && <div className="ai-loading">Analiz yapılıyor…</div>}
              {!loading && err && <div className="ai-error">Hata: {err}</div>}
              {!loading && !err && (
                <pre className="ai-answer">{answer || 'Sonuç alınamadı.'}</pre>
              )}
            </div>

            <div className="ai-modal-footer">
              <button className="ai-button-outline" onClick={() => runAI()} disabled={loading}>
                Yeniden oluştur
              </button>
              <button className="ai-button" onClick={() => setOpen(false)}>
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    
  );
}


/* --- Boş sayfa --- */
function EmptyPage() {
  return <div className="content" />;
}

/* --- Filo Yönetimi (UI BOZULMADAN) --- */
function FleetPage() {
  // Katalog (JSON) ve arama
  const [catalog, setCatalog] = useState([]); // vehicles.json içeriği
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const [queryUtts, setQueryUtts] = useState('');
  const [result, setResult] = useState(null); // {utts, vehicleType, fuelType, tankAmount, photo, (opsiyonel plate)}
  const [showDetails, setShowDetails] = useState(false);
  const [searchErr, setSearchErr] = useState(null);

  // Filodaki araçlar (ekranda da gösteriyoruz, aynı zamanda LS'ye yazacağız)
  const [fleet, setFleet] = useState([]);

  // JSON'u yükle
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/vehicles.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCatalog(Array.isArray(data) ? data : []);
        setLoadErr(null);
      } catch (err) {
        setLoadErr('Araç veri katalogu yüklenemedi.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // LocalStorage’taki önceden eklenmiş filo
  useEffect(() => {
    const saved = loadFleetLS();
    if (saved.length) setFleet(saved);
  }, []);

  // Fleet değiştikçe kalıcı kaydet
  useEffect(() => {
    saveFleetLS(fleet);
  }, [fleet]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!queryUtts.trim()) {
      setResult(null);
      setShowDetails(false);
      setSearchErr('Lütfen UTTS girin.');
      return;
    }
    const q = queryUtts.trim().toLowerCase();
    const found = catalog.find((v) => (v.utts || '').toLowerCase() === q);

    if (found) {
      setResult(found);
      setShowDetails(true);
      setSearchErr(null);
    } else {
      setResult(null);
      setShowDetails(false);
      setSearchErr('Kayıt bulunamadı.');
    }
  };

  const handleAddToFleet = () => {
    if (!result) return;
    setFleet((prev) => {
      const key = (result.utts || '').toLowerCase();
      if (!key || prev.some((x) => (x.utts || '').toLowerCase() === key)) return prev; // duplicate yok
      const withEmission = { ...result, emissions: estimateEmission(result) };
      return [...prev, withEmission];
    });
  };

  return (
    <div className="content">
      {/* JSON yükleme durumu */}
      {loading && <div className="panel"><div>Veri yükleniyor…</div></div>}
      {loadErr && <div className="panel"><div style={{ color: '#b91c1c' }}>{loadErr}</div></div>}

      {/* Arama Paneli */}
      <div className="panel">
        <h3 className="panel-title">UTTS ile Araç Bilgisi Getir</h3>

        <form className="inline-form" onSubmit={handleSearch}>
          <input
            className="input"
            placeholder="UTTS (örn. UTTS-2001)"
            value={queryUtts}
            onChange={(e) => setQueryUtts(e.target.value)}
          />
          <button className="btn" type="submit">Ara</button>
        </form>

        {/* Arama hatası */}
        {searchErr && (
          <div style={{ marginTop: 10, color: '#b91c1c', fontWeight: 600 }}>
            {searchErr}
          </div>
        )}

        {/* Detaylar (ESKİ DÜZEN) */}
        {showDetails && result && (
          <div className="details">
            <div className="field-row">
              <label>UTTS</label>
              <span className="value">{result.utts}</span>
            </div>
            <div className="field-row">
              <label>Araç Tipi</label>
              <span className="value">{result.vehicleType}</span>
            </div>
            <div className="field-row">
              <label>Yakıt Tipi</label>
              <span className="value">{result.fuelType}</span>
            </div>
            <div className="field-row">
              <label>Depo Miktarı</label>
              <span className="value">{result.tankAmount}</span>
            </div>

            <div className="actions">
              <button className="btn-primary" type="button" onClick={handleAddToFleet}>
                Filoya Ekle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FİLO LİSTESİ (ESKİ DÜZEN) */}
      <div className="filo-list">
        <h3 className="panel-title">Filodaki Araçlar</h3>

        <div className="list-headers">
          <span></span>
          <span>Plaka</span>
          <span>Araç Tipi</span>
          <span>Yakıt Tipi</span>
          <span>Depo Miktarı</span>
        </div>

        <div className="list-body">
          {fleet.map((item, idx) => (
            <div className="added-item" key={idx}>
              {item.photo ? (
                <img className="thumb" src={item.photo} alt={item.utts} />
              ) : (
                <div className="thumb" />
              )}
              <span>{item.plate}</span>
              <span>{item.vehicleType}</span>
              <span>{item.fuelType}</span>
              <span>{item.tankAmount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Emisyon Analizi (store’dan okur) --- */
function EmissionsPage() {
  const fleet = loadFleetLS();

  // KPI hesapları
  const totalEmissions = r2(fleet.reduce((s, v) => s + (v.emissions ?? estimateEmission(v)), 0));
  const totalOffset = r2(totalEmissions * OFFSET_RATE);
  const net = r2(totalEmissions - totalOffset);

  // Son eklenen 3 araç
  const last3 = fleet.slice(-3);

  return (
    <div className="content">
      {/* Üst 3 KPI */}
      <div className="em-cards">
        <div className="em-card">
          <div>
            <div className="em-title">Toplam Filo Emisyonu</div>
            <div className="em-num em-red">{totalEmissions}</div>
            <div className="em-sub">ton CO₂</div>
          </div>
        </div>

        <div className="em-card">
          <div>
            <div className="em-title">Karbon Dengeleme</div>
            <div className="em-num em-green">-{totalOffset}</div>
            <div className="em-sub">ton CO₂</div>
            <div className="em-note">Güneş + Krediler (~%40)</div>
          </div>
        </div>

        <div className="em-card">
          <div>
            <div className="em-title">Net Pozisyon</div>
            <div className="em-num em-orange">+{net}</div>
            <div className="em-sub">ton CO₂</div>
            <div className="em-note">
              {totalEmissions ? Math.round((totalOffset / totalEmissions) * 100) : 0}% azalma
            </div>
          </div>
        </div>
      </div>

      {/* Alt 3 kart: Son 3 araç (foto + info + plaka + tank + emisyon) */}
      <div className="fleet-overview">
        {last3.map((v, i) => {
          const e = v.emissions ?? estimateEmission(v);
          return (
            <div className="fleet-card" key={i}>
              <div className="fleet-card-photo">
                {v.photo ? <img src={v.photo} alt={v.plate} /> : <span>Foto yok</span>}
              </div>
              <div className="fleet-card-info">
                <div className="fleet-card-title">
                  {v.vehicleType} | {v.plate}
                </div>
                <div className="fleet-card-detail">{v.tankAmount} • {v.fuelType}</div>
                <div className="fleet-card-detail">{e} ton CO₂ (tahmini)</div>
                <div className={`emission-badge ${
                  e >= 5 ? 'emission-high' : e >= 2 ? 'emission-medium' : 'emission-low'
                }`}>
                  {e >= 5 ? 'Yüksek' : e >= 2 ? 'Orta' : 'Verimli'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Grafikler (Pie) --- */
function ChartPage() {
  const fleet = loadFleetLS();

  // Seçilebilir PLAKA listesi
  const [selectedPlate, setSelectedPlate] = useState(fleet[0]?.plate ?? '');
  const [selectedIdPlate, setSelectedIdPlate] = useState(fleet[0]?.plate ?? ''); // aynı anahtar olsun
  const [chartType, setChartType] = useState('selected'); // selected | sameKind | allTypes

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const selectedVehicle = useMemo(
    () => fleet.find((v) => v.plate === selectedPlate) || fleet[0],
    [fleet, selectedPlate]
  );

  useEffect(() => {
    if (selectedVehicle && selectedVehicle.plate !== selectedIdPlate) {
      setSelectedIdPlate(selectedVehicle.plate);
    }
  }, [selectedVehicle, selectedIdPlate]);

  useEffect(() => {
    if (!fleet.length) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const { labels, values, colors } = buildChartData({
      chartType,
      selectedPlate,
      selectedIdPlate,
      data: fleet,
    });

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', align: 'center' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw;
                const label = context.label || '';
                return `${label}: ${value} ton CO₂`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [chartType, selectedPlate, selectedIdPlate, fleet]);

  return (
    <div className="content">
      <div className="pie-chart-container">
        <div className="pie-chart-controls">
          <label className="control">
            <span>Grafik Tipi</span>
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="selected">Seçili Araç</option>
              <option value="sameKind">Aynı Tür Araçlar</option>
              <option value="allTypes">Tüm Türlerin Toplamı</option>
            </select>
          </label>

          {chartType !== 'allTypes' && (
            <label className="control">
              <span>Plaka</span>
              <select value={selectedPlate} onChange={(e) => setSelectedPlate(e.target.value)}>
                {fleet.map((v) => (
                  <option key={v.plate} value={v.plate}>
                    {v.plate} — {v.vehicleType}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="pie-chart-canvas" style={{ width: '100%', maxWidth: 960, height: 440, margin: '0 auto' }}>
          <canvas ref={canvasRef} id="emissionPieChart" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Chart data helpers ---------- */
function buildChartData({ chartType, selectedPlate, selectedIdPlate, data }) {
  let labels = [];
  let values = [];
  let colors = [];

  if (chartType === 'selected') {
    const vehicle = data.find((v) => v.plate === selectedPlate) || data[0];
    const emissions = vehicle.emissions ?? estimateEmission(vehicle);
    const offset = r2(emissions * OFFSET_RATE);
    // Türkçe legend etiketleri
    labels = ['Emisyon', 'Dengeleme', 'Net'];
    values = [emissions, offset, Math.max(r2(emissions - offset), 0)];
    colors = ['#e11d48', '#10b981', '#d97706'];
  }

  if (chartType === 'sameKind') {
    const pivot = data.find((v) => v.plate === selectedIdPlate) || data[0];
    const sameKind = data.filter((v) => v.vehicleType === pivot.vehicleType);
    labels = sameKind.map((v) => `${v.vehicleType} (${v.plate})`);
    values = sameKind.map((v) => v.emissions ?? estimateEmission(v));
    colors = sameKind.map((_, i) => pickColor(i));
  }

  if (chartType === 'allTypes') {
    const types = [...new Set(data.map((v) => v.vehicleType))];
    labels = types;
    values = types.map((t) =>
      r2(
        data
          .filter((v) => v.vehicleType === t)
          .reduce((sum, v) => sum + (v.emissions ?? estimateEmission(v)), 0)
      )
    );
    colors = types.map((_, i) => pickColor(i));
  }

  return { labels, values, colors };
}

function pickColor(i) {
  const palette = [
    '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6',
    '#eab308', '#f97316', '#a3e635', '#06b6d4', '#ec4899', '#84cc16',
  ];
  return palette[i % palette.length];
}

