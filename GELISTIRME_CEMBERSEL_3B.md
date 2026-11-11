# Çembersel hareket — 3B geliştirme

Sürüm: 2026.11.02-C1. Koleksiyon 120 modül olarak kalır; çembersel hareket modülü dört senaryoyla genişletildi.

## Kullanım

`cembersel-hareket/index.html` dosyasını açın. Sürükleyerek döndürün, tekerlek/iki parmakla yakınlaştırın. Perspektif, üstten ve önden kamera düğmeleri görünümü sıfırlar. Görsel cisim boyutları semboliktir. Kamera yalnız görünümü değiştirir. WebGL açılamazsa etiketli 2B destek görünümü kullanılır.

- Yatay çember: sürtünmesiz masa, merkezde ip, teğet hız ve içe yönelen gerilme.
- İpin kesilmesi: hazır kesilme senaryosu veya yatay sahnede seçilen anda kesme düğmesi. Kesilme sonrasında sabit hızla teğet hareket.
- Düşey çember: enerji korunumu, değişken gerilme, salınım, tam tur ve gevşeme sonrası parabolik uçuş. Hazır koşullar karşılaştırmayı kolaylaştırır.
- Viraj: gereken kuvvet ile tutunma sınırı; hedef yarıçap sağlanamazsa dışa açılan ideal yörünge.

Hız oku ve kuvvet oklarının ölçekleri ayrıdır. Gerçek kuvvetler ve bileşke aynı anda birbirine eklenen kuvvetler gibi gösterilmez. Sabit düzlemli kuvvet diyagramı, sayısal kartlar, önemli anlar tablosu, zaman çizgisi ve kuvvet/enerji/hız grafikleri birlikte çalışır. Mobilde sahne/analiz/grafik sekmeleri bulunur. 60 gözlem ve 22 sütunlu CSV aktarımı desteklenir. Kayıtlar sayfa kapandığında kaybolur.

## Fizik ve sınırlar

Yatay modelde T=mv²/r. Kesme sonrasında yatay net kuvvet sıfırdır. Masa tepkisi ağırlığı dengeler; düşey kuvvetler üstten düzlemde çizilmez.

Düşey model alt noktadan başlar; U=mg(y+r). θ alt noktadan ölçülür. θ''=−(g/r)sinθ, T=mrω²+mg cosθ. Hareket 0,002 s RK4 adımlarıyla hesaplanır. Gevşeme olayı kök aramasıyla ayrılır; serbest uçuş analitiktir. Alt noktadan tam tur sınırı √(5gr). 2<v₀²/(gr)<5 aralığında ip gevşer. İnceleme yeniden gerilmenin ilk geometrik sınırında veya 8 saniyede biter; yeniden gerilme darbesi ve enerji kaybı modellenmez. Düşük hızlar üst noktaya ulaşmadan salınım yapabilir.

Viraj modeli sabit hızlı, sınırlı yan kuvvetli ideal yönlendirmedir. Kullanılan yan kuvvet min(mv²/r, μs mg), oluşan yarıçap mv²/F; μs=0 ve v>0 için teğet doğrusal harekettir. Gerçek lastik kayma dinamiği, frenleme, devrilme veya sürüş güvenliği hesabı değildir. Model bu sınırlamayı ekranda açıklar.

Eski motorlu/serbest düşey görünüm `classic.html` ve `classic.js` olarak korunmuştur. Eski 24 deney regresyonundaki çembersel hareket kontrolü bu sayfayı sınar; yeni model ayrı testlerle doğrulanır.

## Teknik yapı

Mevcut HTML/CSS/JavaScript altyapısı ve yerel Chart.js korunur. Gerçek 3B sahne için Three.js 0.187.0 ve OrbitControls yerel tek dosyaya paketlenmiştir. Kaynak: `cembersel-hareket/scene3d.src.js`; çıktı: `scene3d.js`; MIT lisansı: `vendor/Three-LICENSE.txt`. esbuild 0.28.2 ile yeniden üretim:

```sh
npm install --no-save three@0.187.0 esbuild@0.28.2
npx esbuild cembersel-hareket/scene3d.src.js --bundle --minify --format=iife --platform=browser --target=es2020 --outfile=cembersel-hareket/scene3d.js
```

Bu araçlar sadece geliştirici içindir; kullanıcı derleme yapmaz. Uzak font, model veya CDN çağrısı gerekmez.

## Doğrulama

- `node tests/circular-model.cjs`: 49.387 sayısal karşılaştırma; yatay hareket, teğet ayrılma, düşey enerji, gevşeme, yeniden gerilme sınırı ve viraj sınır durumları. En büyük göreli enerji hatası yaklaşık 1,84×10⁻¹⁰.
- `node tests/circular-ui.cjs`: gerçek WebGL, kamera sürükleme ve üç görünüm, dört senaryo, oynat/duraklat/başa dön, CSV, kayıt koruma ve mobil sekmeler. `CHROMIUM_EXECUTABLE_PATH` isteğe bağlı tarayıcı yolu; Playwright gerekir.
- `tests/physics.cjs`: önceki 24 deneyin fizik regresyonları.
- `tests/browser-all.cjs`: 120 modül ve iki ortak sayfa.
- Sonuçlar `tests/*results.json` içinde tutulur. Görsel kontrol ekran görüntüleri dağıtım paketine eklenmez.

## Kaynaklar

- OpenStax University Physics, 6.3 Centripetal Force: https://openstax.org/books/university-physics-volume-1/pages/6-3-centripetal-force
- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls
