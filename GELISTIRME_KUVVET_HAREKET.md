# Kuvvet, Hareket ve Sürtünme · 2 Kasım 2026

Mevcut `surtunme-kuvveti` modülü geliştirildi. Giriş aynı klasördeki `index.html`; portal kartı yeni adıyla güncellendi. Yerel fontlar, Chart.js ve önceki lacivert/altın tasarım altyapısı kullanılır. Kurulum veya internet gerekmez.

## Uygulanan adımlar

1. **Yatay zemin:** yüzey boyunca hareket eden blok, metre işaretleri, uygulanan kuvvet/sürtünme/normal/ağırlık okları.
2. **Statik–kinetik geçiş:** başlangıç eşiği, hareket sırasında kuvvet azaltma ve kaldırma, durma ve ters hareket. Gerçek sürtünme ile statik üst sınır ayrı gösterilir.
3. **Eğik düzlem:** 0–60° eğim, normal kuvvet, ağırlığın paralel/dik bileşenleri. Bileşenler seçilince ağırlık oku gizlenir; çift sayım yapılmaz.
4. **Hareket grafikleri:** konum, yönlü hız ve ivme; gerçekleşmiş hareketin ortak zamanı ve geçmiş an inceleme çizgisi.
5. **Karşılaştırma:** aynı kuvvet ve yüzeyde farklı kütleler; aynı kuvvet ve kütlede farklı sürtünme katsayıları. A/B ortak grafik eksenleri ve kuvvet ölçeği.

## Kullanım

- Varsayılan A: m=5 kg, μs=0,50, μk=0,30, F=20 N; durgun kalır.
- Oynat, ardından “A: eşiğin üstünde” ile kaymayı başlat.
- “A: eşiğin altında” ile kuvveti azalt. Kayarken statik değil kinetik sürtünme geçerli olduğundan hareket anında sona ermez.
- “Kuvveti kaldır” ile duruşu; “Ters kuvvet uygula” ile yavaşlama ve yön değiştirmeyi izle.
- Kuvvet değişikliği konumu, hızı ve zamanı sıfırlamaz. Kütle, katsayı, başlangıç hızı, eğim, yerçekimi veya senaryo değişikliği yeni deney başlatır.
- Geçmişi incelemek için zaman çizelgesini kullan. Geçmişte kuvvet değişimi kapalıdır; “Canlı sona dön” veya “Sondan devam et” ile kaydın sonuna dönülür.
- İnceleme süresi 20 s. Sınırda duraklatma fiziksel fren değildir. Yeniden başlatmak için “Başa dön”.
- Mobilde başlangıç koşulları açılır paneldedir; Sahne/Kuvvetler/Grafikler sekmeleri kullanılır.
- En fazla 60 gözlem satırı; karşılaştırma bir kayıtta A ve B için iki satır ekler. CSV 20 sütun içerir ve seçili anın kuvvetini, model parametrelerini ve sürümünü taşır.

## Model

+x yatayda sağa, eğimde yokuş yukarıdır. N=mg cosθ, G∥=−mg sinθ, Fnet=F+G∥+f.

Durgun durumda |F+G∥|≤μsN ise f=−(F+G∥), a=0. Eşitlik statik denge kabul edilir. Kaymada f=−sign(v)μkN. Hız sıfırken statik eşik aşılmışsa hareket eğiliminin tersine μkN uygulanır.

Kuvvetin sabit olduğu her zaman aralığı analitik olarak çözülür: x=x₀+v₀Δt+½aΔt², v=v₀+aΔt. Durma zamanı aralığa düşerse adım o anda bölünür; statik denge veya ters hareket kalan sürede yeniden hesaplanır. Böylece frenlemede yapay ters hız üretilmez. Geçmiş konum/hız aynı parçalı çözümden hesaplanır; kuvvet değişimleri ayrı zaman damgalarıyla tutulur.

Düzlem sabit ve sonsuzdur; uygulanan kuvvet yüzeye paraleldir. Hava direnci ve yuvarlanma yoktur. Katsayılar ideal, ayarlanabilir değerlerdir; malzeme ölçümü iddiası yoktur. 0≤μk≤μs zorlanır. Kamera blokla birlikte kayabilir; metre işaretleri ve sayısal konum gerçek yer değiştirmeyi gösterir. Kuvvet aralığı değişince ok ölçeği uyarlanır, aynı anda A ve B için aynıdır.

## Doğrulama

- 12.437 sayısal kontrol: statik denge ve eşik, sürtünmesiz hareket, durma/yön değişimi, eğim, iş–kinetik enerji bağıntısı, tek büyük adım/küçük adım tutarlılığı ve geçmiş örnekleme.
- 10 arayüz kontrol grubu: canlı kuvvet değişimi, geçmiş kuvvet, ters hareket, üç ek senaryo, katsayı sınırı, oynatma/sıfırlama/süre sınırı, CSV, üç ekran genişliği ve çalışma zamanı hataları.
- Mevcut 24 fizik testi geçti; sürtünme testi yeni arayüz API'sine uyarlandı.
- 122 ana sayfanın masaüstü ve mobil taraması geçti.
- Görseller masaüstü ve 390 px mobilde incelendi; grafikler ayrıca kontrol edildi.

Bilimsel dayanak: https://openstax.org/books/university-physics-volume-1/pages/6-2-friction
