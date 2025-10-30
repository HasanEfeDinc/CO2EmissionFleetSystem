# LogiNova -- Filo Servisleri için **AI Destekli CO₂ Emisyon Analiz Sistemi** (v0.1.1a)

LogiNova; şirket filolarındaki araçların yakıt tipi, kullanım oranı ve
emisyon değerlerine göre CO₂ salımını analiz eder. Verileri kullanıcı
dostu bir **dashboard** üzerinde dinamik grafiklerle sunar ve **AI
destekli** kısa analiz/tavsiye çıktıları üretir.

> Bu repo: **React + Vite** tabanlı web arayüzünün PoC (Proof of
> Concept) uygulamasıdır.

------------------------------------------------------------------------

## Özellikler (Mevcut)

-   **Dashboard**: Araç/filo bazlı CO₂ emisyonu grafikleri (Chart.js ile
    responsive).
-   **Veri Görselleştirme**: Yakıt tipi, kullanım oranı ve toplam salım
    karşılaştırmaları.
-   **AI Destekli İçgörü**: Basit tavsiye/özet metinleri (OpenAI Chat
    API).
-   **Hafif ve Hızlı**: Vite + React ile anlık geliştirme deneyimi
    (HMR), modüler JS yapısı.

------------------------------------------------------------------------

## Yol Haritası (Planlanan)

-   **UTTS Entegrasyonu** (Ulusal Taşıt Tanıma Sistemi) -- resmi
    birimler ile uyumlu veri akışı\
-   **Kimlik Doğrulama & RBAC** -- kullanıcı/rol tabanlı yetkilendirme\
-   **İlişkisel Veritabanı** -- kalıcı, raporlanabilir veri modeli\
-   **Gelişmiş AI Modülü** -- rota/yakıt/araç düzeyi öneriler\
-   **Backend Servisleri** -- Node.js/Express ve/veya Go tabanlı
    REST/gRPC

------------------------------------------------------------------------

## Teknolojiler

-   **React.js + Vite** -- arayüz ve geliştirme ortamı\
-   **JavaScript (ESM)** -- modüler iş mantığı\
-   **Chart.js** -- grafikler ve görselleştirme\
-   **OpenAI Chat API** -- AI analiz/tavsiye katmanı

------------------------------------------------------------------------

## Hızlı Başlangıç

### Önkoşullar

-   Node.js **18+**
-   (Opsiyonel) OpenAI API anahtarı: `https://platform.openai.com/`

### Kurulum

``` bash
# 1) Repo’yu klonla
git clone https://github.com/HasanEfeDinc/CO2EmissionFleetSystem.git
cd CO2EmissionFleetSystem

# 2) Bağımlılıkları kur
npm install

# 3) Geliştirici sunucusu
npm run dev
```

### Ortam Değişkenleri

Kök dizinde `.env` dosyası oluştur:

``` dotenv
# OpenAI entegrasyonu için (opsiyonel)
VITE_OPENAI_API_KEY=sk-...

# Demo/config
VITE_APP_NAME=LogiNova
VITE_DEFAULT_UNIT=kgCO2e
```

> Not: Tarayıcı tabanlı projelerde gizli anahtarları **doğrudan
> istemciye** koymak güvenli değildir. Üretimde proxy/backend üzerinden
> çağrı yapmanız önerilir.

------------------------------------------------------------------------

## Örnek Veri Modeli (Demo)

``` json
{
  "fleet": [
    { "id": "AR-001", "fuel": "diesel", "usage_km": 1200, "avg_consumption_l_100km": 8.5 },
    { "id": "AR-002", "fuel": "gasoline", "usage_km": 900,  "avg_consumption_l_100km": 6.7 },
    { "id": "AR-003", "fuel": "electric", "usage_km": 700,  "kwh_per_100km": 18.0 }
  ],
  "emission_factors": {
    "diesel": 2.68,
    "gasoline": 2.31,
    "electric": 0.35
  }
}
```

> PoC aşamasında veriler yerel/dummy kaynaklardan okunur. Üretimde;
> UTTS, veritabanı ve backend servisleri devreye alınacaktır.

------------------------------------------------------------------------

## Proje Komutları

``` bash
npm run dev      # Geliştirici sunucusu
npm run build    # Üretim derlemesi
npm run preview  # Üretim derlemesini lokal önizleme
npm run lint     # ESLint kontrolü
```

------------------------------------------------------------------------

## Katkı

Katkı, öneri ve geri bildirimlere açığız.\
- Issue açabilir veya küçük PR'lar gönderebilirsin.\
- Yeni özellik önerilerinde lütfen kısa bir kullanım senaryosu ekleyin.

------------------------------------------------------------------------

## Arka Plan & Amaç

-   Ulaşım/taşımacılık sektörü, küresel CO₂ salımının **%24+**'ünü
    oluşturuyor.\
-   İşletmelerin **ESG uyumluluğu**, **operasyonel verimlilik** ve
    **sürdürülebilirlik** hedefleri doğrultusunda emisyonlarını izleyip
    azaltmaları kritik.\
-   LogiNova, dijital dönüşüm ve sürdürülebilirliği bir araya getirerek
    **ölçeklenebilir bir filo analitiği** çözümü sunmayı hedefler.

------------------------------------------------------------------------

**Hazırlayanlar:**\
- Taha Yasir Çolak\
- Hasan Efe Dinç

> Görüş ve tavsiyeleriniz değerli. Kısa ve net geri bildirimleri
> memnuniyetle karşılarız.
