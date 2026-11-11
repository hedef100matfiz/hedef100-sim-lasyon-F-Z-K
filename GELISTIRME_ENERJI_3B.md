# Enerji dönüşümleri — 3B görünüm

3 Kasım 2026. Altı mevcut senaryo (sürtünmesiz rampa, pürüzlü yüzey, karşılaştırma, yay, çift rampa, statik sürtünme eşiği) etkileşimli üç boyutlu düzeneğe taşındı. Fareyle sürükleme, tekerlek/iki parmak yakınlaştırma, perspektif/yandan/üstten kameralar vardır.

Mavi raylar sürtünmesiz, turuncu dokulu yüzey pürüzlüdür; mor helisel yay hesaplanan sıkışma miktarını izler. Yeşil hız oku hareket yönünü gösterir. Statik eğim senaryosunda kuvvetler açıldığında ağırlık, normal ve sürtünme okları çizilir. Sayısal enerji bütçeleri, termal enerji, grafikler, gözlemler ve CSV korunmuştur. Turuncu yüzey bir sıcaklık ölçeği değildir. Cisim boyutu semboliktir; fizik modeli noktasal cisme dayanır.

Fizik modeli değiştirilmedi. Düzeneğin tüm konumları ve yay sıkışması model çıktısından üretilir. WebGL açılamayan cihazlarda mevcut 2B çizim kullanılır. Çembersel hareket dahil diğer modüller korunmuştur.

Three.js 0.187.0 ve OrbitControls, esbuild 0.28.2 ile scene3d.src.js dosyasından scene3d.js içine paketlendi. Lisans vendor/Three-LICENSE.txt içinde. Kullanıcı için internet veya kurulum gerekmez.

Doğrulama: enerji-model 329 + enerji-2b-model 205 kontrol; mevcut energy-ui testindeki dört senaryo ve kontrol/kayıt/CSV/mobil grubu; yeni energy-3d-ui ile altı senaryo, gerçek WebGL, kamera değişiminde fizik durumunun korunması, çift sahne ve mobil taşma kontrolü. Masaüstü ve telefon boyutunda görsel inceleme yapıldı.
