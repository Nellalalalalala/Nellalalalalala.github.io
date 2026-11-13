#!/usr/bin/env python3
"""Generate the static research page and its methodology from the shared input."""
import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from html import escape as e
from pathlib import Path
from recalculate import calculate, main as recalculate

ROOT = Path(__file__).resolve().parent


def number(value):
    val = Decimal(str(value))
    whole, _, fraction = format(val, 'f').partition('.')
    fraction = fraction.rstrip('0')
    return f'{int(whole):,}'.replace(',', ' ') + (',' + fraction if fraction else '')


def chart(rows):
    width, height, left, top, bottom = 1120, 300, 48, 22, 250
    step = (width - left - 14) / len(rows)
    out = [f'<svg class="chart" viewBox="0 0 {width} {height}" role="img" aria-labelledby="chart-title chart-description" xmlns="http://www.w3.org/2000/svg">',
           '<title id="chart-title">Найденные и восстановленные числа за 1922–1991 годы</title>',
           '<desc id="chart-description">Частичный охват: 1922–1927 и города 1935–1954. Пробелы обозначены штриховкой у основания; это не нулевые значения. Все числа и источники доступны в годовой таблице ниже.</desc>',
           '<defs><pattern id="missing-pattern" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M-1 1l2-2M0 4l4-4M3 5l2-2" stroke="#7c8472" stroke-width="1"/></pattern></defs>']
    for v in (0,20,40,60,80):
        y = bottom - v/90*(bottom-top)
        out += [f'<line class="gridline" x1="{left}" y1="{y:.2f}" x2="{width-8}" y2="{y:.2f}"/>', f'<text text-anchor="end" x="{left-12}" y="{y+4:.2f}">{v}</text>']
    names={'published':'СССР, опубликовано','partial':'Частичный охват','derived':'Расчёт по коэффициенту','missing':'Пробел, не ноль'}
    for i,row in enumerate(rows):
        x=left+i*step+2
        h=float(row['value'])/1000/90*(bottom-top) if row['value'] is not None else 6
        y=bottom-h
        label=f"{row['year']}: " + (number(row['value']) if row['value'] is not None else 'данных в подборке нет') + '. ' + names[row['kind']]
        out.append(f'<a href="#year-{row["year"]}" aria-label="{e(label,quote=True)}"><title>{e(label)}</title><rect class="bar {row["kind"]}" x="{x:.2f}" y="{y:.2f}" width="{step-4:.2f}" height="{h:.2f}" rx="1"/></a>')
        if row['year'] in (1922,1930,1940,1950,1960,1970,1980,1991):
            out.append(f'<text text-anchor="middle" x="{x+(step-4)/2:.2f}" y="276">{row["year"]}</text>')
    return ''.join(out)+'</svg>'


def annual_rows(rows):
    labels={'published':'Опубликовано','partial':'Частичный охват','derived':'Расчёт','missing':'Пробел'}
    out=[]
    for r in rows:
        if r['value'] is None:
            display='—'
        elif r['kind']=='derived':
            display='≈ '+number((Decimal(r['value'])/1000).quantize(Decimal('.1'),rounding=ROUND_HALF_UP))+' тыс.'
        else:
            display=('≈ ' if r['kind']=='published' and r['year']!=1980 else '')+number(r['value'])
        refs=' '.join(f'<a href="#{s}">{s}</a>' for s in r['sources']) or '—'
        note=e(r['note'])
        precision=f'<p>{e(r["precision"])}</p>' if r['precision'] else ''
        locator=f'<p>{e(r["locator"])}</p>' if r['locator'] else ''
        out.append(f'''<tr id="year-{r['year']}" data-kind="{r['kind']}" data-year="{r['year']}"><td class="year">{r['year']}</td><td class="num">{display}</td><td class="coverage-cell"><span class="badge {r['kind']}">{labels[r['kind']]}</span><br>{e(r['coverage'])}</td><td class="notes"><details><summary>Основание и ограничения</summary><div class="formula">{e(r['formula'])}</div>{locator}<p>{note}</p>{precision}</details></td><td class="sources">{refs}</td></tr>''')
    return '\n'.join(out)


def sources_html(sources):
    out=[]
    for s in sources:
        links=[]
        for key,label in [('file_url','Первичный PDF'),('text_url','Прочитанный полный текст'),('bibliography_url','Список литературы'),('local','Сохранённый скан')]:
            if key in s: links.append(f'<a href="{e(s[key],quote=True)}">{label} ↗</a>')
        out.append(f'<li id="{s["id"]}"><span class="source-id">{s["id"]}</span><div><h3><a href="{e(s["url"],quote=True)}">{e(s["title"])}</a></h3><p>{e(s["citation"])}</p><p>{e(s["role"])}</p><div class="source-links">'+''.join(links)+'</div></div></li>')
    return '\n'.join(out)


def main():
    recalculate()
    data=json.loads((ROOT/'data/input.json').read_text())
    rows,summary=calculate(data)
    context={key:number(value) for key,value in summary.items() if isinstance(value,str) and value.replace('.','').isdigit()}
    for label,predicate in [('early',lambda r:r['year']<=1927),('urban',lambda r:1935<=r['year']<=1954),('late',lambda r:r['year']>=1965 and r['kind']=='published')]:
        context[label+'_expression']=' + '.join(number(r['value']) for r in rows if predicate(r) and r['value'] is not None)
    context['derived_expressions']='\n'.join(f"{r['year']}: {r['formula']}".replace('.',',') for r in rows if r['kind']=='derived')
    context.update(chart=chart(rows),annual_rows=annual_rows(rows),source_list=sources_html(data['sources']))
    page=(ROOT/'index.template.html').read_text()
    for key,value in context.items():page=page.replace('{{'+key+'}}',value)
    assert '{{' not in page, 'Unresolved template field'
    (ROOT/'index.html').write_text(page,encoding='utf-8')
    md=['# Самоубийства в СССР, 1922–1991: методика и расчёт','',
        'Проверено 14 ноября 2026 года. Полный итог НЕ установлен. Ни одна частичная сумма ниже не является итогом за всю историю СССР.','',
        '## Правила','',
        'Единица — зарегистрированная смерть, не попытка. Один выбранный показатель на год. РСФСР не подменяет СССР. Города и неполные территории не масштабируются. Пропуски остаются null; коэффициенты для отсутствующих лет не интерполируются. Полный календарный 1922 год включён по условиям запроса, хотя СССР образован 30 декабря; строгий государственный период этим не восстановлен.','',
        '## Частичные суммы','',
        f"1922–1927, неполная территория: {context['early_expression']} = {context['early_1922_1927']}.",
        f"1935–1954, только города: {context['urban_expression']} = {context['urban_1935_1954']}.",
        f"11 общесоюзных опубликованных чисел: {context['late_expression']} = {context['published_union_1965_1990']}.",
        f"Сумма выбранных абсолютных чисел: {context['published_arithmetic_sum']} (около 840 тыс.; 37 лет, в 26 неполный охват).",'',
        '## Обратный расчёт','',
        'N = r × (P(t) + P(t+1)) / 2 × 10, где P в миллионах, r — общий коэффициент на 100 000. Среднегодовое население приближено полусуммой; за 1979 используется перепись 17 января. Величины округлены; знаменатели могут отличаться от оригинальных. Это не архивные абсолютные числа.','',
        '```text',context['derived_expressions'],'```','',
        f"Расчётные значения добавляют {context['derived_arithmetic_sum']}. Расширенная сумма: {context['augmented_arithmetic_sum']} ≈ 1,66 млн; 51 год хотя бы с частичным значением. Из них только 25 лет имеют общесоюзное число или его расчётное приближение. Дроби — результат формул, не дробные люди. Без 1922: {context['augmented_without_1922']}.",'',
        '## Неизвестные части','',
        'Годы без выбранного значения: '+', '.join(map(str,summary['missing_years']))+'. Также отсутствуют части территории раннего периода и сельская местность 1935–1954. Ошибки классификации и полнота регистрации не оценены; строгой нижней границы и обоснованного доверительного интервала нет.','',
        '## Редакции и расхождения','',
        '1926: 6522+188=6710 (уточнённая таблица ЦСУ). Ряд 4010/4681/5846/5934 — РСФСР, не СССР. За 1927 опубликованы предварительные числа с расширенным охватом. Гернет описывает 38/143/60 поздних листков за 1922/1923/1924; выбранные районные таблицы их не включают, альтернативная редакция отличается на241. 1980: выбрано71353 и не используется ошибочный коэффициент28,9. Население1976=255,6млн и1982=268,8млн по ЦСУ. Документы РИО отдельных случаев не добавлены к годовым суммам.','',
        '## Источники','']
    for s in data['sources']:
        md += [f"### {s['id']}. {s['title']}",'',s['citation'],'',s['role'],'',s['url']]
        for key in ('file_url','text_url','bibliography_url'):
            if key in s:md.append(s[key])
        md.append('')
    md += ['## Воспроизведение','',
           'Скачать recalculate.py и data/input.json, сохранив структуру каталогов. Python 3 без зависимостей: python3 recalculate.py. Он формирует annual.csv, annual.json, summary.json. Исходные данные содержат источники каждого входа и значения мужчин/женщин для сверенных первичных таблиц. Для пересборки HTML в репозитории — python3 build_page.py.','']
    (ROOT/'methodology.md').write_text('\n'.join(md),encoding='utf-8')
    files=['data/input.json','data/annual.json','data/annual.csv','data/summary.json','data/urban-transcription.csv','recalculate.py','build_page.py','index.template.html','index.html','methodology.md','style.css','app.js','sources/tsu-1928-social-anomalies.pdf','sources/tsu-table-37.jpg','sources/rgae-urban-1945-1954.jpg','fonts/Oswald.ttf','fonts/OFL-Oswald.txt']
    manifest={'reviewed':'2026-11-14','algorithm':'SHA-256','files':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in files}}
    (ROOT/'sources/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':main()
