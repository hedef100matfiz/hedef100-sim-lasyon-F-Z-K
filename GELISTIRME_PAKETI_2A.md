# Geliştirme Paketi 2A — Mekanik Enerji ve Dönüşümler

29 Ekim 2026 teslimi · Model sürümü: 2026.10.28-2A

Mevcut `enerji-donusumu` modülü, dört senaryolu enerji laboratuvarına dönüştürüldü. 120 modüllük koleksiyonun diğer deneyleri ve önceki geliştirme paketinin düzeltmeleri korunur. Uygulama çevrimdışı açılır; kurulum gerekmez.

## Dört çalışan senaryo

1. **Sürtünmesiz iniş:** Kütle, yükseklik ve ilk hız değiştirilir. Rampa sonunda inceleme biter; kinetik ve yerçekimi potansiyel enerjilerinin toplamı korunur.
2. **Sürtünmeli parkur:** Yatay bölüm uzunluğu ve kayma sürtünmesi değiştirilir. Cisim bölümün ortasında durabilir; yalnız gerçekten alınan yol kadar termal enerji artışı hesaplanır.
3. **A/B karşılaştırma:** A’da μ=0; B’de seçilen μ uygulanır. Başlangıç koşulları, çizim ölçeği, enerji ölçeği ve ortak saat aynıdır. Bir deney daha erken biterse son durumu tutulur; kendi model zamanı ve bitiş nedeni yazılır.
4. **Yayda dönüşüm ve geri dönüş:** Cisim yayı sıkıştırır, geri döner ve pürüzlü bölümden tekrar geçer. Enerjisi yeterliyse rampaya çıkar ve yeniden iner. Sürtünmesiz durumda enerji salınımı; sürtünmeli durumda mekanik enerjinin termale dönüşmesi izlenir.

## Yeni gözlem araçları

- Kinetik K, yerçekimi Ug, yay Uy ve termal enerji artışı ΔEth ayrı gösterilir.
- Mekanik enerji ve toplam enerji ayrı toplamlar olarak gösterilir; bileşenlerle birlikte tekrar toplanmaz.
- Enerji–zaman ve enerji–parkur konumu grafikleri; seçili an işaretleri; eğri gizleme/gösterme.
- Duraklatma, 0,05 saniyelik adım, 0,25× / 0,5× / 1× hız ve zaman çizelgesinden geçmiş inceleme.
- Grafikler tüm hesaplanan hareketi baştan gösterir; işaretler seçili anı gösterir. Gidiş ve dönüş aynı konumda farklı enerjilere sahip olabilir.
- Tam parametreleri, model sürümünü, model zamanını ve ortak saati içeren gözlem tablosu/CSV. Kayıtlar sayfa kapatılınca silinir; saklamak için CSV indirilir.
- Mobilde tek sütun düzeni, okunabilir anlık değerler ve kaydırılabilir gözlem tablosu.

## Hızlı deneme

ZIP’i yeni bir klasöre tamamen çıkarın. Ana `index.html` dosyasını açın; “Mekanik Enerji ve Dönüşümler” kartını seçin.

**100 J örneğini kur** düğmesi: m=2 kg, h=5 m, v₀=0, g=10 m/s², μ=0,2, pürüzlü uzunluk 6 m, k=200 N/m. Başlangıçta 100 J yerçekimi enerjisi vardır. Rampanın sonunda 100 J kinetik enerji, pürüzlü bölüm sonunda 76 J kinetik + 24 J termal enerji görülür. Yaklaşık t=2,798 s’de ilk maksimum yay sıkışması oluşur: kinetik enerji sıfır, yay enerjisi 76 J, termal artış 24 J; sıkışma yaklaşık 0,872 m.

“Sürtünmeli / sürtünmesiz karşılaştırma” seçeneğinde zaman çizelgesini ilerletin. Sürtünme katsayısını artırınca B deneyinin erken durmasını; A deneyinde mekanik enerjinin korunmasını inceleyin.

## Fizik modeli ve sınırları

- Doğrusal rampa 30° ve sürtünmesizdir. Eski kavisli rampanın yerine bu geometrinin seçilmesi, görsel ile kuvvet/hareket hesabının açıkça aynı modele dayanmasını sağlar.
- Kayma sürtünmesi yalnız yatay bölgede: F=μmg. Yay ve yay bölgesi idealdir. Statik sürtünme, hava direnci, yuvarlanma veya sıcaklık hesabı yoktur.
- Cisim + Dünya + yay + yüzey sisteminde K+Ug+Uy+ΔEth sabittir. Termal gösterge sıcaklık değildir.
- Hareket, sabit ivmeli bölümler ve ideal yay salınımı için parçalı analitik çözümlerden üretilir. Durma, yaydan ayrılma ve rampada dönüş anları ayrı hesaplanır. Grafik, çizim ve CSV aynı model durumunu kullanır.
- İnceleme en fazla 30 saniyedir. Parkur dışına çıkış veya inceleme sonu, fiziksel frenleme olarak modellenmez; bitiş nedeni kullanıcıya yazılır.
- A/B karşılaştırma ortak zamandadır. Konum eksenli grafik vardır; iki cismi otomatik olarak aynı konuma getiren ayrı karşılaştırma modu henüz eklenmemiştir.

## Testler

- 329 analitik model senaryosu: enerji dengesi, termal enerjinin monoton artışı, kontrol sınırları, sıfır enerji, erken durma, kütle etkisi, yay dönüşü ve kayıtlı geçmiş sorgulaması.
- Hedefli tarayıcı kontrolü: dört senaryo; oynat/duraklat, tek adım, sıfırlama, grafik ekseni, kayıt/CSV ve mobil taşma.
- Koleksiyonun 122 sayfalık açılış/etkileşim kontrolü ve kaynak deneylerin fizik kontrolleri başarıyla yeniden çalıştırıldı; sonuç dosyaları `tests` klasöründedir.

Node.js ile `node tests/energy-model.cjs` çalıştırılır. Tarayıcı testleri Playwright/Chromium gerektirir. Bu araçlar laboratuvarı kullanmak için gerekmez.

## Sonraki alt paket

Çift rampalı ayrı senaryo, statik/kinetik sürtünme eşiği, dış kuvvetin yaptığı iş, aynı iş/farklı güç, F–x grafiği ve otomatik aynı-konum karşılaştırması. Bunlar planın 2B ve sonraki aşamalarındadır; bu sürümde tamamlandı olarak sunulmaz.
