# Geliştirme paketi 1 — 28 Ekim 2026

120 deney ve model korunmuştur. Mevcut lacivert–altın arayüz, çevrimdışı çalışma ve kaynak 24 deneyin dosyaları korunur.

## Bu sürümde tamamlananlar

- **Compton:** Gelen ve saçılan foton ile elektron momentumları ortak ölçekten çizilir. Elektron oku momentum farkından hesaplanır; 0°’de geri tepme oku kaldırılır. Açı yatay ve düşeyde aynı ölçekle çizilir. Elektronun kinetik enerjisi sonuçlara eklenir.
- **Gölge:** Kaynak, cisim ve perde tek uzunluk ölçeğine bağlanır. Sınır ışınları cismin kenarında yön değiştirmez. Büyük gölgeler kırpılmadan sığdırılır. Noktasal kaynak varsayımı korunur.
- **Yol–yer değiştirme:** Negatif konumlar dahil başlangıç, dönüş ve bitiş noktaları görünür aralıkta kalır. Batı negatif, doğu pozitif olarak işaretlenir. Sıfır yol bir noktayla gösterilir.
- **İş–güç:** Kuvvet oku büyüklüğe ve açıya bağlıdır; sıfır kuvvette çizilmez. Pozitif, negatif ve sıfır iş durumları açıklanır.
- **Yuvarlanma:** 30° eğimde durgunluktan başlayan ivmeli hareket uygulanır. Konum ve dönüş aynı yol hesabına bağlıdır: s=rθ. Anlık hız ve geçen model zamanı eklenir. Cisim alt noktada durdurulur; yeniden oynatma mümkündür. Bu durdurma deneyin bitişidir, fiziksel bir çarpışma modeli değildir.
- **Manyetik kuvvet:** Yörünge periyodu qB/m ile hesaplanır. Sabit ölçek / otomatik sığdırma seçimi, ölçek çubuğu, hız ve kuvvet yönleri eklenir. Kaydedilen referans yörünge kesikli mor çizgiyle aynı uzunluk ölçeğinde gösterilir. Sabit ölçekte alan dışına çıkan yörünge açıkça belirtilir. Proton ve elektron için görselleştirme zaman katsayıları farklıdır ve ekranda yazılıdır.
- **Ortak arayüz (96 yeni modül):** Canvas yazılarının 16 px boyutlu metin karşılıkları eklenir; bu bölüm mobil açılışta açıktır. Animasyonlu modüllere 0,25× / 0,5× / 1× oynatma seçimi eklenir. Klavye odak işaretleri belirginleştirilir.
- **Gözlem kaydı:** CSV’ye modül kimliği, model sürümü ve animasyon saati eklenir. Animasyon saati, manyetik modelde belirtilen katsayıyla fiziksel zamana çevrilir; her modülde doğrudan fiziksel saniye anlamına gelmez.

## Nasıl deneyebilirsiniz?

1. ZIP’i tamamen yeni bir klasöre çıkarın; ana `index.html` dosyasını açın.
2. Compton’da açıyı 0°, 45° ve 180° yapın; elektron okunu ve saçılma açısını karşılaştırın.
3. Gölge’de kaynak–cisim uzaklığını azaltın; ışınların doğrusal kaldığını izleyin.
4. Yuvarlanma’da 0,25× hız seçip oynatın; çizgi işareti ile cismin ilerlemesini izleyin.
5. Manyetik kuvvette mevcut yörüngeyi karşılaştırmaya alın, B’yi iki katına çıkarın: yeni yarıçap referansın yarısı olur. Sabit ölçeği de deneyin.
6. Telefonda “Şekildeki yazılar ve açıklamalar” bölümünden küçük çizim yazılarını okuyun.

## Kontroller ve sınırları

- 186 mevcut model kontrolü: başarılı.
- 86 yeni fizik/geometri kontrolü: başarılı. Momentum ve enerji dengesi, gölge ışınlarının doğrusal olması, negatif konumların görünmesi, kaymadan yuvarlanma, manyetik yarıçap/periyot oranları ve işin işareti kontrol edildi.
- 122 sayfanın masaüstü/mobil tarayıcı kontrolü: başarılı. Sayfa açılışı, yeni modüllerde gözlem kaydı/CSV/sıfırlama ve ilgili oynatma kontrolleri; portal filtreleri ve yatay taşma kontrolü.
- 12 hedefli arayüz senaryosu: başarılı. Yeni çizimler, kontrollü animasyon saatinde yavaşlatma/durma/yeniden oynatma, mobil 16 px açıklamalar, yörünge referansı/sıfırlama ve CSV alanları.
- Önceki 10 arayüz iyileştirme kontrolü: başarılı.
- Yerel bağlantı ve ortak JavaScript sözdizimi kontrolü: başarılı.

Sayısal ve otomatik arayüz testleri, tüm 120 modül için bağımsız alan uzmanı veya öğrenci kullanım incelemesi yerine geçmez. Bu paket, önceki analizdeki ilk uygulama grubudur. Biyoloji/kimya sahnelerinin ayrıntılandırılması, görünür derinlik, inceleme kuyruğundaki kalan görsel geri bildirim adayları, gerçek veri kaynakları ve ölçüm–grafik etkinlikleri sonraki paketlerin kapsamındadır.

## Geliştirici için

Model ve çizim kaynakları `shared/models.js` ve `shared/scenes.js`; ortak etkileşimler `shared/explorer.js` ve `shared/explorer.css` içindedir. Yeni `LabScenes.geometry` fonksiyonu çizimde ve fizik/geometri testlerinde ortak kullanılır. Kaynak 24 deney dosyaları değiştirilmemiştir.

Node.js ile `node tests/new-models.cjs` ve `node tests/visual-physics.cjs` çalıştırılabilir. Tarayıcı kontrolleri Playwright/Chromium gerektirir: `node tests/browser-all.cjs`, `node tests/upgrade-ui.cjs`, `node tests/refinements.cjs`. Gerekirse `CHROMIUM_EXECUTABLE_PATH` ile Chromium yolu verilir. Test çalıştırmak için gereken araçlar, son kullanıcının laboratuvarı açması için gerekli değildir.
