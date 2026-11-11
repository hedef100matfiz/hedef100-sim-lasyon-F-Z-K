# Katalog ve program kullanımı güncellemesi — 11 Kasım 2026

- Dinamometre, basit devre, atık ayırma, ışık renkleri, yenilenebilir enerji ve sürtünme modüllerinin sınıf etiketleri bütün katalog ve sayfa kopyalarında eşitlendi.
- 120 modüle `gradeUsage`, `moduleType`, `curriculumStatus`; 96 yeni modülün JSON ve tarayıcı kataloğuna aynı alanlar eklendi.
- Portal kartlarına içerik türü/program rozeti ve iki yeni filtre eklendi; filtreler URL parametreleriyle korunur.
- Bütün modül sayfalarına sınıf bazında rol ve düzey gösteren erişilebilir kullanım bloğu eklendi.
- DNA önceki program, mitoz–mayoz destekleyici içerik olarak açıklandı. Doğrudan ünite eşlemesi olmayan on modül kapsam sayfasında ayrı gruplandı; doğrulanmamış MEB bağlantısı eklenmedi.
- `tests/catalog-consistency.cjs` eklendi. Ana 3B hücre ve klasik 2B hücre sayfası genel tarayıcı testinde ayrı hedefler oldu; 3B biyoloji ve enerji testleri JSON raporu üretir.
- Simülasyon hesap motorları ve fizik modelleri değiştirilmedi.

---

# 120 modüllük genişletme — 26 Ekim 2026

- Kaynak 24 deneyin klasörleri ve fizik kodları korundu.
- 96 yeni deney/model ayrı adreslerle eklendi; liste `YENI_DENEYLER.md` içindedir.
- Portalın özgün arka planı, kart yapısı, lacivert/altın renkleri ve yazı tipleri korundu; 5–12. sınıf, konu, metin araması ve yeni modül filtreleri eklendi.
- Kaynak üç panelli deney düzeni yeni modüllere uygulandı.
- Yeni modüllere gözlem defteri, CSV indirme, varsayım notu, gözlem görevi ve açıklaması eklendi.
- MEB'in 43 ünite başlığı için kaynaklı konu haritası eklendi. Bu harita bir kazanım sertifikası değildir.
- Bağımlılıklar yerel; paket çevrimdışı çalışır.

---

# Önceki 24 deneylik bakım sürümünün değişiklikleri

# Deney bazında değişiklikler

Mevcut tasarım ve dosya düzeni korunmuştur. Her satır ilgili deneyin `script.js` ve gerekiyorsa HTML/CSS dosyalarına uygulanmıştır.

1. **ozkutle-karisimlar:** Birikimli kütle korunumu; duraklatma sonrası yoğunluk değişimi yalnızca yeni sıvıya uygulanır; grafik geçmişi sınırlandı.
2. **dayaniklilik-adezyon:** Kılcallık yüksekliği Jurin bağıntısıyla hesaplanır; malzeme ve cam temas açısı varsayımları açıklanır.
3. **dogrusal-hareket:** Sayısal zaman ekseni ve deterministik örnekleme; x/v/a grafikleri zaman-değer çiftleri kullanır.
4. **surtunme-kuvveti:** Hız ve konum durumu, başlat/duraklat/sıfırla, statik/kinetik geçiş, duruş zamanı.
5. **enerji-donusumu:** Küçük alt adımlı RK4, anlık enerji toplamı, sabit yay duvarı, rampanın üst sınırında enerji korunarak durma.
6. **hal-degisimi:** Başlangıç evresini ve sıcaklığını koruyan entalpi tabanlı hesap; sayfa başlığı modele uyarlandı.
7. **elektriklenme:** Ayır işlemi yükleri korur; gecikmiş yaprak animasyonu iptal edilir; tutarlı sayısal biçim.
8. **ohm-yasasi:** Sıfır akımda elektron animasyonu durur.
9. **manyetik-alan:** Sıfır akım seçimi ve sıfır alan çizimi; zaman tabanlı animasyon.
10. **pascal-prensibi:** İletilen kuvvet ve yükün gerektirdiği basınç ayrıldı; şematik hareket ve renk ölçeği açıklandı.
11. **arsimet-prensibi:** Nötr yüzebilirlikte farklı derinlikler; ip geometrisi ve sıvı yüzeyi eşleştirildi.
12. **kuresel-aynalar:** Ayna yönleri, odakta paralel çıkan ışınlar, görüntü sınırı kontrolü.
13. **yay-dalgalari:** Sabit ve serbest uç sınırlarını sağlayan görüntü atmalarının süperpozisyonu.
14. **egik-atis:** Kare hızından bağımsız zaman, vakumda analitik çözüm, dirençte RK4, ilk yer teması ve yeniden başlatma.
15. **tork-denge:** Denge dışı durumlarda gerçekmiş gibi gösterilen destek kuvvetleri kaldırıldı; devrilme yönü şeması açıklandı.
16. **momentum-carpisma:** Sürekli temas testi, temas normalinde impuls, yapışma, deney sırasında başlangıç kontrollerinin kilitlenmesi.
17. **elektrik-alan:** SI uzunluk ölçeği; sıfır alanda potansiyelin bağımsız gösterimi; dokunma ve klavye; yük sayısı sınırı.
18. **kapasitor-dielektrik:** Tam yerleştirme, oran sürgüsü, pil bağlı durumda doğru alan açıklaması, sıfır gerilim çizimi ve dokunmatik giriş.
19. **alternatif-akim:** Rezonans için tek tolerans; zamana bağlı osiloskop kayması.
20. **cembersel-hareket:** Alt nokta başlangıcı, hızın doğru aktarımı, RK4 ve ip gevşeyince balistik hareket.
21. **kepler-yorunge:** Kepler denklemi; eşit süreli alanlar; parametre değişince eski taramaların silinmesi; tanımlı hız/kuvvet birimleri.
22. **harmonik-hareket:** Doğrusal olmayan basit sarkaç, büyük açı periyodu ve enerji tutarlılığı; düşük g seçimi doğru işlenir.
23. **cift-yarik:** İdeal dar yarık modeli açıklandı; fiziksel yarık genişliğinden türemeyen Gauss zarfı kaldırıldı.
24. **fotoelektrik:** Akım ve elektronlar için ortak başlangıç enerji dağılımı; doğrusal foton akısı ve tutarlı durdurucu alan.

## Ortak düzenlemeler

Yerel ve sürümü sabit grafik/ikon dosyaları, model açıklamaları, giriş etiketleri, klavye odağı ve mobil yerleşim düzeltmeleri eklendi. Kaynak ZIP’in git geçmişi çalıştırma paketine dahil edilmedi.
