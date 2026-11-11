# Geliştirme Paketi 2B — İlk teslim

29 Ekim 2026 · Model sürümü: 2026.10.29-2B1

Enerji laboratuvarındaki mevcut dört senaryo korunarak iki senaryo eklendi. Koleksiyon 120 modüldür; enerji modülünün içinde artık altı senaryo bulunur.

## 05 · Çift rampada enerji

İki rampa 30° ve sürtünmesizdir. Aralarındaki yatay bölümde kayma sürtünmesi uygulanır. Cisim karşı rampaya çıkar, durgun olduğu tepe noktasından geri döner ve tekrar pürüzlü bölgeden geçer. Yeterli enerjisi yoksa karşı rampaya ulaşmadan durur.

İlk karşı tepe mor işaretle gösterilir; yüksekliği ve ulaşma zamanı ayrıca yazılır. Kesikli yatay çizgi başlangıç yüksekliğidir. İlk hız sıfır ve sürtünme yoksa karşı tepe başlangıç yüksekliğine eşittir. İlk hız varsa karşı tepe daha yüksek olabilir; bunun nedeni başlangıçtaki kinetik enerjidir.

Yatay bölüm tamamen geçilebiliyorsa ilk tepe yüksekliği:

h_tepe = h₀ + v₀²/(2g) − μk L

Bu bağıntı yalnız sürtünmenin yatayda olduğu model içindir; genel bir eğik yüzey formülü değildir. İlk tepeye ulaşılamıyorsa “ulaşamıyor” bilgisi gösterilir.

**Referans:** m=2 kg, h₀=5 m, v₀=0, g=10 m/s², μk=0,2, L=6 m. İlk karşı tepe 3,80 m; o anda Ug=76 J, termal artış 24 J ve toplam 100 J olur. μk=0 yapıldığında ilk tepe 5 m’dir.

## 06 · Statik ve kinetik sürtünme

Bu senaryoda cisim seçilen eğimde durgunluktan başlar. Eğim açısı, düzlem uzunluğu, kütle, g, μs ve μk değiştirilebilir. 0≤μk≤μs koşulu arayüzde korunur. μs azaltılırsa μk gerektiğinde aynı sınıra indirilir; bu davranış kontrollerin yanında açıklanır.

Göstergeler: ağırlığın eğim bileşeni, normal kuvvet, statik sürtünmenin maksimum değeri, gerçek sürtünme, net eğim kuvveti, ivme ve kritik açı. Ağırlık, normal ve sürtünme vektörleri ortak kuvvet ölçeğinde çizilir.

- N=mgcosθ, eğim boyunca ağırlık=mgsinθ.
- mgsinθ≤μsN iken cisim durur; gerçek statik sürtünme mgsinθ kadardır. Maksimum sınır her durumda gerçek sürtünme değildir.
- Eşitlikte model durgunluğu korur; hareket eşiğin aşılmasıyla başlar.
- Kayma başladığında Fk=μkN, a=g(sinθ−μkcosθ).
- Kritik açı θkritik=arctan(μs).
- Statik dengede v=0 ve termal enerji artışı=0. Kaymada termal artış μkNs kadardır.
- Düzlem uzunluğu L ve eğim θ seçildiğinden başlangıç yüksekliği Lsinθ olarak hesaplanır; ayrı yükseklik ve ilk hız kontrolleri bu senaryoda gizlenir.

**Deneme:** μs=0,40 ve μk=0,20 seçin. 10°’de cisim durur. 30°’de aşağı kayar. Kritik açı yaklaşık 21,80°’dir. Kütleyi değiştirmek bu ideal modelde kritik açıyı değiştirmez.

## Ortak özellikler

İki yeni senaryo da mevcut enerji göstergeleri, zaman/konum grafikleri, zaman çizelgesi, oynatma hızı ve gözlem CSV’sini kullanır. Statik dengede oynatma ve tek adım düğmeleri devre dışıdır; ekranda statik denge nedeni gösterilir. Her parametre değişikliği yeni başlangıç koşulu kurar, önceki gözlemler tabloda kalır.

CSV’ye eğim açısı ve statik sürtünme katsayısı da eklendi. Eski enerji modelinin dört senaryosu ve 100 J yay örneği korunur.

## Model sınırları

- İlk beş senaryoda sürtünme yalnız yatay bölgede, altıncıda eğik yüzeydedir.
- Rampalar doğrusal, yay idealdir; hava direnci, yuvarlanma ve sıcaklık hesabı yoktur.
- Cisim + Dünya + yay + yüzey sisteminin K+Ug+Uy+ΔEth enerjisi korunur.
- Hareket parçalı analitik hesaplanır. Durgunluk eşiği için küçük bir sayısal tolerans kullanılır.
- İnceleme en fazla 30 saniyedir. Parkur üst sınırından çıkış veya düzlem sonu fiziksel bir frenleme değildir; bu noktadan sonraki hareket modellenmez.
- Bu teslimde yeni bir dış kuvvet / güç senaryosu veya aynı-konuma otomatik karşılaştırma modu yoktur; bunlar 2B’nin sonraki teslimindedir.

## Kontroller

205 yeni fizik kontrolü; çift rampada enerji dengesi, ilk tepe, geri dönüş, erken durma, sıfır enerji, farklı kütleler, statik eşik, eşitlik ve eşik üstü hareketi kapsar. Önceki 329 enerji modeli kontrolü de yeniden çalıştırıldı.

Hedefli arayüz kontrolleri; yeni senaryolar, katsayı sınırları, gizlenen/açılan kontroller, durgunlukta oynatma durumu, CSV alanları ve mobil taşmayı kapsar. Koleksiyonun 122 sayfalık tarayıcı kontrolü ayrıca yeniden çalıştırıldı. Sonuçlar `tests` klasöründe bulunur.

Test komutları: `node tests/energy-2b-model.cjs`, `node tests/energy-model.cjs`; Playwright/Chromium ile `node tests/energy-2b-ui.cjs`, `node tests/energy-ui.cjs`, `node tests/browser-all.cjs`. Test araçları son kullanıcının laboratuvarı açması için gerekli değildir.
