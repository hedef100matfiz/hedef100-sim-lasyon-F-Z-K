# 3B biyoloji paketi 1 — 8 Kasım 2026

Bu teslimat 120 modüllük koleksiyondaki üç modülü günceller; tüm koleksiyonun 3B dönüşümünün tamamlandığı anlamına gelmez.

- Hücre: onaylanan yarı saydam bitki/hayvan hücresi tasarımı, organel seçimi, döndürme, yakınlaştırma, parçaları ayırma, gözlem kaydı ve CSV. Önceki görünüm hucre/classic.html içinde korunur.
- DNA: üç örnek dizide 0–8 eşlenme basamağı, iki yavru DNA, eski/yeni omurga renkleri, baz seçimi ve klavyeyle kullanılabilen seçim listesi.
- Mitoz–mayoz: başlangıç 2n=4–12, dört özet basamak, kromozom/kromatit sayılarıyla uyumlu 3B hücreler. Önden, üstten ve perspektif kamera. Bütün mikroskobik evreler veya parça değişimi modellenmez.

Başlatmak için ZIP dosyasını çıkarıp ana index.html dosyasını açın. Modeller çevrimdışı çalışır. DNA ve bölünmede 2B/3B görünüm değiştirilebilir. WebGL yoksa 2B kullanılabilir.

## 2026–2027 sınıf eşleştirmesi

- Hücre: Fen Bilimleri 5. sınıf, FB.5.3.1. Ayrıntılı organel açıklamaları zenginleştirme içindir.
- DNA: Fen Bilimleri 8. sınıf önceki program, DNA ve Genetik Kod, F.8.2.1.2–3. Yeni 8. sınıf Yaşamın Gizemi ünitesine yapılan bağ kaldırıldı.
- Mitoz–mayoz: 8. sınıf düzeyinde destekleyici içerik; doğrudan zorunlu kazanım karşılığı olarak sunulmaz. 7. sınıf etiketi kaldırıldı.
- Bu pakette diğer 117 modülün tüm kazanım eşleştirmeleri yeniden denetlenmedi.

Kaynaklar:
https://tymm.meb.gov.tr/taslak-cerceve-planlari/temel-egitim
https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/388
https://tymm.meb.gov.tr/ogretim-programlari/fen-bilimleri-dersi/8
https://ttkb.meb.gov.tr/meb_iys_dosyalar/2021_04/23113635_2021_lgs_konukazanimlari.pdf

## Doğrulama

- 122 sayfalık mevcut tarayıcı taraması geçti; hücrenin eski kontrolleri classic.html üzerinde korunarak sınandı.
- Üç yeni 3B sayfa ayrıca gerçek WebGL ile test edildi: DNA'nın 27 dizi/basamak durumu, bölünmenin 40 tür/sayı/basamak durumu, kamera, seçim listesi, 2B geçişi ve hücre CSV kaydı.
- 186 mevcut model kontrolü geçti.
- 1440 ve 390 piksel genişliklerde görsel kontrol; sayfa hatası ve dış ağ bağımlılığı bulunmadı.
- WebGL kapalıyken üç sayfanın 2B erişimi doğrulandı.

Kaynak: shared/bio3d.src.js ve hucre/cell3d.src.js. Dağıtım paketleri Three.js 0.187.0 ve OrbitControls içerir; internet gerekmez. Derleme için Three.js ve esbuild kullanılır. Test: CHROMIUM_EXECUTABLE_PATH ayarlayıp node tests/bio3d.cjs çalıştırın.
