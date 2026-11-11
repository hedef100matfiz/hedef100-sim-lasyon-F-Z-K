# İtme–Momentum geliştirmesi · 1 Kasım 2026

Ana giriş: `momentum-carpisma/index.html`. Eski iki boyutlu disk deneyi `momentum-carpisma/iki-boyut.html` bağlantısıyla korunmuştur.

## Tamamlanan sıra

1. Tek boyutlu, iki arabalı esnek çarpışma; kütleler ve işaretli hızlar.
2. Yapışmalı çarpışma; ortak son hız ve iç enerjiye dönüşen kinetik enerji.
3. Kısmen esnek çarpışma; e katsayısı ve iki uç durum.
4. İtme–temas süresi incelemesi; üçgen/dikdörtgen kuvvet profilleri, zıt işaretli alanlar ve ortalama kuvvet.
5. Newton'un üçüncü yasası için tahmin sorusu; eşit kütle, ağır/hafif, karşılıklı geliş ve çarpışmayan araba örnekleri.

Lacivert/altın tasarım, yerel fontlar ve mevcut Chart.js altyapısı kullanıldı. Hız/momentum okları, anlık değerler, başlangıç/son/seçili an tablosu, ağır çekim, zaman çizgisi, çarpışmanın iki tarafına geçiş, 60 gözlemlik defter ve 19 sütunlu CSV eklendi.

## Hesap modeli ve sınırlar

P = m₁u₁ + m₂u₂; v₁′ = [P − m₂e(u₁−u₂)]/(m₁+m₂); v₂′ = [P + m₁e(u₁−u₂)]/(m₁+m₂).

A soldadır. u₁ > u₂ ise 6 m başlangıç aralığı kapanır; aksi halde çarpışma yoktur. Dış itme sıfırdır. Kinetik enerji farkı ΔU = ½[m₁m₂/(m₁+m₂)](1−e²)(u₁−u₂)² olarak sistemin iç enerjisine aktarılır. Tekerlekler semboliktir; dönme, hava direnci ve ray sonu modellenmez.

Ray animasyonu anlık çarpışmadır. Kuvvet grafiği bundan ayrı, aynı Δp değerini veren ideal bir temas darbesidir. Temas süresi yalnız grafiği ve ortalama kuvveti değiştirir; son hızları değiştirmez. Profil gerçek ölçüm değildir. Bu ayrım arayüzde de açıklanır.

Kamera arabaları takip eder ve gerektiğinde yakınlaştırmayı değiştirir; uzunluk ölçeği sahnede belirtilir. Okların ortak ölçeği o anda görünür alana sığacak şekilde ayarlanır; sayısal değerler kartlarda bulunur.

## Kontroller

- 3.683 sayısal kontrol: kütle/hız/katsayı uçları, momentum ve enerji dengesi, restitüsyon, zıt itmeler, kuvvet alanları, çarpışmasız durumlar ve parametre doğrulaması.
- 8 arayüz kontrol grubu: üç tür, oynatma/duraklatma/sıfırlama, tahmin, temas süresi, CSV, mobil ve korunmuş 2B deney.
- Mevcut 24 fizik testi; eski momentum testi artık iki boyutlu sayfaya gider.
- 390, 768 ve 1440 piksel genişliklerinde kontrol ve görsel inceleme.

Kaynaklar:
- https://openstax.org/books/university-physics-volume-1/pages/9-2-impulse-and-collisions
- https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions

122 ana sayfanın masaüstü/mobil taraması geçti; yerel bağlantılarda eksik hedef bulunmadı. İki boyutlu ek sayfa ayrıca kontrol edildi.
