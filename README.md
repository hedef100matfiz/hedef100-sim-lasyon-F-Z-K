Güncel ek: üç modüllük 3B biyoloji paketi için GELISTIRME_BIYOLOJI_3B.md dosyasını okuyun.

# Ahmet Hocanın Simülasyon Laboratuvarı — 120 Deney ve Model

5–8. sınıf fen bilimleri ve 9–12. sınıf fizik için **96 yeni modül**, daha önce düzeltilen **24 deney** üzerine eklendi. Mevcut deney klasörleri ve hesaplamaları korundu. Yeni sayfalar kaynak projenin HTML, CSS, Canvas ve üç panelli düzenini kullanır; yeni bir framework veya kurulum gerektirmez.

## Nasıl açılır?

1. ZIP’i yeni bir klasöre **tamamen çıkarın**.
2. Ana klasördeki **index.html** dosyasını Chrome veya Edge ile açın.
3. Sınıf, konu veya arama filtresiyle deney seçin. “Yalnız yeni eklenenler” seçeneği 96 yeni sayfayı gösterir.
4. Bir değişkeni değiştirin; görsel ve sonuç panelini birlikte inceleyin.
5. Yeni sayfalarda “Gözlemi kaydet” ile farklı durumları karşılaştırın. Kayıtları saklamak için **CSV indir** düğmesini kullanın.

Klasör yapısını koruyun: `vendor`, `shared`, `assets`, `ohm-yasasi` ve diğer deney klasörleri birlikte bulunmalıdır. ZIP içinden tek bir HTML dosyası çalıştırmayın. Sayfaları açmak için Node.js veya internet gerekmez; yalnız dış MEB kaynak bağlantıları internet kullanır.

## Kullanım ayrıntıları

- Yeni modüllerde sürgüler klavyeyle (ok, Home, End), seçim kutuları ve düğmeler dokunarak kullanılabilir.
- “Animasyonu oynat” yalnız hareketli sahnelerde veya süreç sürgüsünü ilerleten modellerde görünür. Diğer modeller kontrol değiştikçe güncellenir.
- “Görseli büyüt” geniş çizim görünümüne geçer. Dar ekranda büyüyen çizim yatay kaydırılabilir; “Normal görünüme dön” ile kapatılır.
- “Sıfırla” parametreleri ve oynatmayı başa alır. Gözlem defterindeki önceki ölçümleri korur; onları ayrı “Kayıtları temizle” düğmesi siler.
- Gözlem defteri sayfada en fazla 30 kayıt tutar. Sayfa kapanırsa kayıtlar kaybolur; CSV ile indirin. Veriler bir sunucuya gönderilmez.
- Her yeni modülde gözlem görevi, beklenen açıklama, formül/ilke ve model varsayımları vardır.

## Kapsam

Tarayıcıda **kapsam.html**, MEB TYMM sayfalarındaki **43 ünite başlığını** çalışan modüllere bağlar. Kaynaklara erişim tarihi: 26 Ekim 2026. `KONU_KAPSAMI.json` aynı eşleştirmenin makine tarafından okunabilir hâlidir.

Bu eşleştirme ünite ve temel konu düzeyindedir; bütün kazanımların eksiksiz öğretildiği veya resmî uygunluk onayı anlamına gelmez. Program geçişlerinde okulun kullandığı yıllık plan esas alınmalıdır. Bilim tarihi, kariyer keşfi, sağlık alışkanlıkları ve araştırma görevleri ayrıca ele alınır. 9. sınıf kariyer ünitesine bağlanan ölçme modülü bilimsel yöntem desteğidir; meslek rehberi değildir.

Bazı içerikler nicel deney, bazıları kavramsal modeldir. Biyolojik süreçlerin hızı, temsili ekosistem sayıları ve tek katmanlı iklim modeli gerçek yaşam için tahmin araçları değildir. Varsayımlar her sayfada, ayrıca `MODEL_NOTLARI.json` içinde açıklanır. Görseller 2 boyutlu şemalardır; yeni bir 3D motor eklenmemiştir.

## Sınıf kullanımı ve içerik türü metadata’sı

`shared/catalog-all.json` 120 modülün tamamında, `shared/catalog-new.json` ve `shared/catalog-new.js` ise 96 yeni modülde `gradeUsage`, `moduleType` ve `curriculumStatus` alanlarını taşır. `gradeUsage` içindeki her sınıf için `role` (`dogrudan`, `destekleyici`, `onceki-program`) ve `level` (`temel`, `ileri`) ayrı tutulur. Sınıf çipi tek başına doğrudan kazanım eşleştirmesi anlamına gelmez.

Portalda içerik türü ve program durumu filtreleri bulunur. Her modül sayfasındaki “Sınıf ve program kullanımı” bloğu bu bilgileri JavaScript kapalıyken de okunabilir biçimde gösterir. DNA `onceki-program`, mitoz–mayoz `destekleyici` olarak işaretlidir. Doğrudan ünite eşlemesi olmayan on modül `kapsam.html` içinde destekleyici ve ileri düzey gruplarına ayrılmıştır; bunlara yeni MEB ünite bağlantısı eklenmemiştir.

## Neler eklendi?

Tam liste **YENI_DENEYLER.md** dosyasında; önceki 24 deneyin düzeltmeleri **DEGISIKLIKLER.md** içinde korunur. Yeni başlıklar arasında gökyüzü, hücre ve sistemler, DNA ve kalıtım, madde/kimya, çevre, basınç, termodinamik, dalgalar, optik, elektrik–manyetizma ve modern fizik vardır.

## Testler

- `tests/new-models.cjs`: 96 yeni modelin kontrol sınırları ve 90 ayrı referans/korunum/ilişki senaryosu, toplam 186 kontrol.
- `tests/catalog-consistency.cjs`: katalog–JavaScript–portal–modül sayfası metadata eşitliği, altı sınıf düzeltmesi ve kapsam durumları.
- `tests/browser-all.cjs`: 120 ana deney + hücrenin klasik 2B sayfası + portal + kapsam sayfası; yeni modüllerde tüm seçim seçenekleri ve sürgü uçları, sıfırlama, oynatma/duraklatma, iki gözlem kaydı ve CSV indirme; masaüstü ve 390 px mobil taşma kontrolü.
- `tests/refinements.cjs`: dokunma, klavye, büyütme, süreç sıfırlama ve görsel tepkiler.
- Önceki `tests/physics.cjs` ve `tests/interactions.cjs`: kaynak 24 deney için önceki fizik ve etkileşim kontrolleri.
- Sonuç JSON dosyaları aynı klasördedir. Otomasyon belirli senaryoları doğrular; bütün cihazları ve bütün parametre birleşimlerini kapsamaz.

Geliştirici ortamında:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/catalog-consistency.cjs
node tests/new-models.cjs
node tests/physics.cjs
node tests/interactions.cjs
node tests/browser-all.cjs
node tests/refinements.cjs
node tests/bio3d.cjs
node tests/energy-3d-ui.cjs
```

İstenirse kurulu Chromium yolu `CHROMIUM_EXECUTABLE_PATH` ortam değişkeniyle verilir. Uygulamanın kendisi Node.js kullanmaz.

## Dosya yapısı ve yayınlama

`shared/catalog-new.json`: yeni deney tanımları; `shared/models.js`: hesaplamalar; `shared/scenes.js`: çizimler; `shared/explorer.js`: etkileşim ve gözlem defteri. Her modülün ayrı bir `index.html` adresi vardır. `shared/catalog-all.json` 120 modülün filtre ve pedagojik kullanım etiketlerini içerir. `shared/curriculum.css` bütün modüllerdeki kullanım bilgisi bloklarını biçimlendirir. Portal kaynak tasarımın `style.css` dosyasını, yeni deneyler kaynak `ohm-yasasi/style.css` dosyasını ek stillerle kullanır.

Paket statik barındırmaya uygundur. Bu teslim herhangi bir canlı siteyi veya GitHub deposunu değiştirmez.

## Üçüncü taraflar

Chart.js 4.4.8, chartjs-plugin-annotation 3.1.0, Lucide 0.468.0 ve yerel Inter/Outfit/Share Tech Mono yazı tipleri kaynak sürümden korunmuştur. Lisanslar `vendor/` içindedir. Yeni modellerde ilave üçüncü taraf kütüphane yoktur.

## 28 Ekim 2026 güncellemesi

İlk bilimsel/görsel geliştirme paketi uygulanmıştır. Altı fizik deneyinde çizim iyileştirmeleri, 96 yeni modülde okunabilir metin açıklamaları, oynatma hızı ve zaman/sürüm içeren CSV kaydı için [GELISTIRME_PAKETI_1.md](GELISTIRME_PAKETI_1.md) dosyasını okuyun.

## Enerji laboratuvarı — 28 Ekim 2026

Enerji modülü dört senaryo, ayrı enerji göstergeleri, A/B karşılaştırma, grafikler, zaman çizelgesi ve CSV ile genişletildi. [GELISTIRME_PAKETI_2A.md](GELISTIRME_PAKETI_2A.md) dosyasında kullanım ve model sınırları bulunur.

## Çift rampa ve sürtünme eşiği — 29 Ekim 2026

Enerji modülüne 05 · Çift rampada enerji ve 06 · Statik ve kinetik sürtünme senaryoları eklendi. Kullanım ve fizik varsayımları: [GELISTIRME_PAKETI_2B1.md](GELISTIRME_PAKETI_2B1.md).

## Son görsel güncelleme

Enerji modülünün altı senaryosu yenilendi. Ayrıntılar: GELISTIRME_GORSEL.md. Telefonda Sahne / Enerji / Grafik sekmelerini kullanın.

## İtme–Momentum güncellemesi · 1 Kasım 2026

İki arabayla üç çarpışma senaryosu, itme–temas süresi incelemesi, tahmin sorusu ve gözlem defteri eklendi. Eski iki boyutlu deney modül içinden açılır. Ayrıntılar: GELISTIRME_MOMENTUM.md.

## Kuvvet–Hareket güncellemesi · 2 Kasım 2026

Kuvvet, Hareket ve Sürtünme modülünde yatay zemin, eğik düzlem, farklı kütleler ve farklı yüzeyler senaryoları var. Kuvvet hareket sırasında değiştirilebilir; geçmiş hareket grafiklerden incelenebilir. Ayrıntılar: GELISTIRME_KUVVET_HAREKET.md.

## 3B çembersel hareket güncellemesi — 2 Kasım 2026

Ana menüden **3B Çembersel Hareket ve Merkezcil Kuvvet** modülünü açın. Sahneyi sürükleyerek döndürün; tekerlek veya iki parmakla yakınlaştırın. Üstten ve önden görünüm düğmeleri, hız/kuvvet okları, dört senaryo, zaman çizgisi, üç grafik ve 60 kayıtlık CSV gözlem defteri bulunur. WebGL kullanılamazsa açıkça etiketlenmiş 2B destek görünümü açılır. Kullanım için kurulum ve internet gerekmez. Önceki düşey çember sayfası modül içindeki bağlantıda korunur. Ayrıntılar: `GELISTIRME_CEMBERSEL_3B.md`.

## Enerji modülünde 3B — 3 Kasım 2026

**Mekanik Enerji ve Dönüşümler** modülünün altı senaryosu döndürülebilir 3B düzeneğe geçirildi. Ayrıntılar: `GELISTIRME_ENERJI_3B.md`.

## Müfredat güncellemesi — 11 Kasım 2026

Bu klasör doğrudan kullanılabilir. Simülasyonları çalıştırmak için Node.js, Playwright veya başka bir paket kurmanız gerekmez. `index.html` dosyasını güncel Chrome veya Edge ile açın.

Bu sürümde 120 modülün katalog ve sayfa meta verileri, sınıf kullanım rolleri, modül türü ve müfredat durumu güncellendi. Portalda modül türü ve müfredat durumu filtreleri bulunur. `kapsam.html` içinde doğrudan ünite eşlemesi yapılmayan destekleyici ve ileri düzey içerikler ayrı gösterilir.

Son doğrulamada katalog tutarlılığı ve çalıştırılabilen yedi model testi hatasız tamamlandı. Güncel rapor `tests/CURRICULUM_VALIDATION.json` dosyasındadır. Tarayıcı otomasyonu bu paketleme ortamında Playwright bulunmadığı ve Chrome başlatılamadığı için yeniden çalıştırılamadı. `tests/browser-all-results-PREVIOUS-RUN.json` yalnızca önceki çalıştırmanın tarihsel raporudur; bu sürümün güncel tarayıcı testi sonucu değildir.
