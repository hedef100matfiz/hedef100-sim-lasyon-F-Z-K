#!/usr/bin/env python3
"""Yeni simülasyon klasörlerini mevcut portala otomatik ekler (Python stdlib)."""
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "simulasyonlar"
INDEX = ROOT / "index.html"
BEGIN = "<!-- OTOMATIK_DENEYLER_BASLANGIC -->"
END = "<!-- OTOMATIK_DENEYLER_BITIS -->"
GRADES = tuple(str(i) for i in range(5, 13))
TOPICS = {"Basınç", "Canlılar", "Dalgalar", "Elektrik", "Enerji", "Hareket", "Isı", "Kuvvet", "Madde", "Modern fizik", "Optik", "Uzay", "Çevre", "Ölçme"}
TYPES = {"sanal-deney": "Sanal deney", "kavramsal-model": "Kavramsal model", "etkilesimli-sema": "Etkileşimli şema", "siniflandirma-etkinligi": "Sınıflandırma etkinliği"}
STATUSES = {"dogrudan": "Ünite bağlantılı", "destekleyici": "Destekleyici içerik", "ileri-duzey": "İleri düzey", "onceki-program": "Önceki program"}

def esc(s):
    return html.escape(str(s), quote=True)

def load_entries():
    entries=[]
    if not BASE.exists():
        return entries
    for directory in sorted(BASE.iterdir()):
        if not directory.is_dir() or directory.name.startswith('.') or not (directory/'index.html').is_file():
            continue
        metadata = directory/'bilgi.json'
        try:
            info=json.loads(metadata.read_text(encoding='utf-8')) if metadata.is_file() else {}
        except (ValueError, UnicodeError) as exc:
            raise SystemExit(f'{metadata}: Geçersiz JSON: {exc}')
        if not isinstance(info,dict):
            raise SystemExit(f'{metadata}: JSON nesnesi gerekli')
        if info.get('yayinda') is False:
            continue
        grades=info.get('siniflar',info.get('sinif',[9]))
        if not isinstance(grades,list):grades=[grades]
        grades=[str(i).strip() for i in grades]
        if not grades or any(g not in GRADES for g in grades):
            raise SystemExit(f'{metadata}: sinif/siniflar 5-12 arasında olmalı')
        topic=str(info.get('konu','Hareket'))
        kind=str(info.get('tur','sanal-deney'))
        status=str(info.get('program','destekleyici'))
        if topic not in TOPICS or kind not in TYPES or status not in STATUSES:
            raise SystemExit(f'{metadata}: konu, tur veya program geçersiz')
        title=str(info.get('baslik') or directory.name.replace('-',' ').title())
        desc=str(info.get('aciklama') or 'İnteraktif simülasyonda değişkenleri keşfedin.')
        icon=str(info.get('ikon') or 'box')
        if not re.fullmatch(r'[a-z0-9-]{1,48}',icon):icon='box'
        entries.append(dict(baslik=title,aciklama=desc,siniflar=grades,konu=topic,tur=kind,program=status,ikon=icon,url='simulasyonlar/'+quote(directory.name,safe='')+'/index.html'))
    return entries

def card(e):
    grades=','.join(e['siniflar'])
    search= ' '.join((e['baslik'],e['aciklama'],e['konu']))
    chips=''.join(f'<span>{esc(g)}. sınıf</span>' for g in e['siniflar'])
    return (f'<a href="{esc(e["url"])}" class="sim-card" data-grades="{esc(grades)}" data-topic="{esc(e["konu"])}" '
            f'data-search="{esc(search)}" data-new="true" data-module-type="{esc(e["tur"])}" '
            f'data-curriculum-status="{esc(e["program"])}" data-grade-usage="{esc(";".join(g+"|"+e["program"]+"|temel" for g in e["siniflar"]))}">'
            f'<div class="sim-icon blue"><i data-lucide="{esc(e["ikon"])}"></i></div>'
            f'<div class="sim-content"><div class="card-meta">{esc(e["konu"])} <span>YENİ 3B</span></div>'
            f'<h2>{esc(e["baslik"])}</h2><p>{esc(e["aciklama"])}</p>'
            f'<div class="pedagogy-chips"><span class="module-type">{esc(TYPES[e["tur"]])}</span>'
            f'<span class="curriculum-status status-{esc(e["program"])}">{esc(STATUSES[e["program"]])}</span></div>'
            f'<div class="grade-chips">{chips}</div></div>'
            '<div class="sim-arrow"><i data-lucide="arrow-right"></i></div></a>')

def main():
    text=INDEX.read_text(encoding='utf-8')
    if text.count(BEGIN)!=1 or text.count(END)!=1:
        raise SystemExit('index.html otomatik katalog işaretleri eksik veya tekrarlı')
    entries=load_entries()
    grouped={g:[] for g in GRADES}
    for e in entries:
        # İlk sınıfta tek kart gösterilir; data-grades diğer sınıfları da destekler.
        grouped[e['siniflar'][0]].append(e)
    parts=[]
    for grade,items in grouped.items():
        if items:
            title='Fen Bilimleri' if int(grade)<9 else 'Fizik'
            parts.append(f'<section class="category-section otomatik-grup" data-group="{grade}"><h2 class="category-title">{grade}. Sınıf · {title} · Yeni Simülasyonlar</h2><div class="sim-grid">')
            parts.extend(card(e) for e in items)
            parts.append('</div></section>')
    content='\n'.join(parts)
    text=re.sub(re.escape(BEGIN)+r'.*?'+re.escape(END),BEGIN+'\n'+content+'\n'+END,text,flags=re.S)
    # Sabit 120 deneylik özgün portal başlıkları korunurken toplam sayılar da güncellenir.
    total=120+len(entries)
    text=re.sub(r'(?<=<strong id="total-experiments">)\d+',str(total),text,count=1)
    text=re.sub(r'(?<=<strong id="new-experiments">)\d+',str(96+len(entries)),text,count=1)
    text=re.sub(r'\b\d+ etkileşimli deney ve modelle',f'{total} etkileşimli deney ve modelle',text,count=1)
    text=re.sub(r'(?<=id="result-count" role="status">)\d+ modül',f'{total} modül',text,count=1)
    INDEX.write_text(text,encoding='utf-8')
    (BASE/'katalog.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{len(entries)} yeni deney eklendi; toplam {total} deney.')

if __name__=='__main__':
    main()
