# Hedef 100 · Otomatik deney ekleme

Bu paket mevcut **120 simülasyon kartını korur**. Yeni deneyler için aşağıdaki klasör yapısını kullanın:

```text
simulasyonlar/
  serbest-dusme-3b/
    index.html
    bilgi.json
    model.glb       (gerekliyse)
    script.js       (gerekliyse)
    style.css       (gerekliyse)
```

`bilgi.json` oluşturmak için `simulasyonlar/ORNEK_BILGI.json` dosyasını kopyalayın. `siniflar` alanına 5–12 arasında bir veya daha fazla sınıf yazın. `konu`, ana sayfadaki konu filtresiyle eşleşmelidir: Basınç, Canlılar, Dalgalar, Elektrik, Enerji, Hareket, Isı, Kuvvet, Madde, Modern fizik, Optik, Uzay, Çevre, Ölçme. `tur`: sanal-deney, kavramsal-model, etkilesimli-sema, siniflandirma-etkinligi. `program`: dogrudan, destekleyici, ileri-duzey, onceki-program.

**Yayımlama:** GitHub Desktop ile depo klasörünü açın, bu paketin **içindeki** tüm dosyaları (üst klasörün kendisini değil) depo köküne kopyalayıp `Commit` + `Push origin` yapın. GitHub Pages kaynağınız `main` / `root` olmalıdır. GitHub Actions > Yeni deneyleri otomatik listele iş akışının çalıştığını kontrol edin. Deney klasörü yüklendiğinde ve içinde `index.html` bulunduğunda iş akışı kartı ana sayfaya ekler; `yayinda: false` olanlar eklenmez. Silinen klasörlerin kartları da kaldırılır. `bilgi.json` yoksa basit varsayılan bilgiler kullanılır (9. sınıf, Hareket).

**Not:** GitHub'ın klasik web arayüzüne ZIP'i doğrudan yüklemek ZIP'i otomatik açmaz. GitHub Desktop kullanın ya da klasörün içindeki dosyaları `github.dev` editörüne sürükleyin.

İlk yükleme sonrasında **Actions > Yeni deneyleri otomatik listele > Run workflow** işlemini bir kere çalıştırın. Sonraki klasör eklemelerinde otomatik çalışır. Actions `git push` 403 hatası verirse Settings > Actions > General > Workflow permissions altında `Read and write permissions` seçeneğini açın; korumalı branch varsa ayrıca izin gerekebilir. Bu iş akışı sadece **main** branch'e göre ayarlanmıştır.

**Yerel kullanım:** Python 3 ile proje kökünden `python scripts/katalog_olustur.py` komutunu çalıştırarak yeni kartları yükleme öncesinde oluşturabilirsiniz. Sonra `index.html`, `simulasyonlar/katalog.json` ve yeni deneyleri birlikte commit edin.

Özgün portalın mevcut 120 kartının sınıf/konu eşleştirmelerine dokunulmadı. Yeni deneylerin sınıf/konu doğruluğu `bilgi.json` ile sizin belirlediğiniz bilgilere dayanır.
