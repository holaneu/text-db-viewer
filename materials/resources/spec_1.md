Zde je kompletní návrh **PRD (Project Requirements Document)** pro aplikaci *Databázový prohlížeč*, který je připraven jako zadání pro vytvoření funkční a ihned použitelné aplikace v čistém JavaScriptu:

---

# **Project Requirement Document (PRD)**  
## **Název projektu:** Databázový prohlížeč  
## **Popis:**  
Jednoduchá webová aplikace pro nahrání a interaktivní prohlížení strukturovaných JSON databází bez nutnosti backendu. Aplikace bude fungovat čistě ve webovém prohlížeči a umožní uživatelům nahrát JSON databázi, nakonfigurovat pole pro zobrazení, vyhledávání, filtrování a řazení, a následně procházet výsledky.

---

## **Použité technologie**
- **Frontend:**  
  - Čistý JavaScript (vanilla JS)
  - HTML5, CSS3
  - Žádný framework nebo knihovna (ani jQuery, React, Vue apod.)
- **Styling:**
  - Moderní a responzivní design
  - Vestavěný dark theme
  - Využití **CSS tříd pro UI komponenty**, které usnadní opětovné použití v jiných projektech
- **Platforma:**  
  - Klientská webová aplikace, fungující bez serveru

---

## **Uživatelské scénáře a funkcionalita**

### 1. **Nahrání databázového JSON souboru**
- Tlačítko typu `<input type="file">`, umožňující nahrát `.json` soubor.
- Po nahrání:
  - Zjistí se typ struktury:
    - **Typ 1:** Soubor obsahuje `db_info` a `collections` → uživatel zvolí konkrétní collection
    - **Typ 2:** Seznam objektů se nachází přímo v kořenovém poli
  - Zvolená kolekce se uloží jako aktivní datová množina pro zobrazení

### 2. **Inicializační konfigurace prohlížeče (UI konfigurátor)**
Po načtení dat následuje krok konfigurace polí:

- UI komponenta bude ve formě rozbalitelného (expandable) panelu.
- Obsahuje následující konfigurační prvky:
  - **Dropdowny** pro mapování polí k ovládacím prvkům:
    - `Search`, `Filter1`, `Filter2`, `Filter3`, `Sort1`, `Sort2`
    - Každý dropdown obsahuje:
      - `not used` jako výchozí hodnotu
      - Seznam všech unikátních polí z dat (včetně vnořených, ve formátu `field1.field2`)
  - **Multi-select** checkbox pro výběr, které pole se mají zobrazovat na kartě každé položky

### 3. **Ovládací panel pro vyhledávání, filtrování a řazení**
Umístěn v horní části aplikace.

- **Search pole:** textové pole s debounce logikou (zpožděné hledání)
- **Filter dropdowny (1–3):**
  - Label podle zvoleného pole
  - Výběrové pole (`<select>`) s možností `---` (žádný filtr) a unikátními hodnotami z vybraného pole
- **Sort dropdown:**
  - Zobrazuje možnosti jako:
    - `field (ascending)`
    - `field (descending)`
  - Kombinuje všechna pole přiřazená k Sort1 a Sort2

### 4. **Zobrazení položek databáze**
- Seznam karet nebo řádků s daty
- Každá karta zobrazuje pouze pole vybraná v konfiguraci
- Responzivní zobrazení (desktop i mobil)

---

## **Logika filtrování a řazení**
1. **Filtrování:**  
   - Aplikuje se jako první
   - Každý aktivní filtr zužuje množinu položek podle shody hodnoty (přesná shoda)

2. **Vyhledávání:**  
   - Textové hledání přes všechna viditelná pole položek (nebo všechna pole, pokud žádná nejsou specifikována)

3. **Řazení:**  
   - Umožňuje vícenásobné třídění podle pořadí výběru (`Sort1`, `Sort2`)
   - Pro každé pole:
     - Pokud pole obsahuje:
       - **Čísla nebo ISO datumy:** Třídit jako čísla nebo datumy
       - **Boolean řetězce ("true"/"false"):** Třídit jako booleany
       - **Pole (Array):** Použít první hodnotu nebo počet prvků
       - **Jiné řetězce:** Třídit jako text
   - Uživatel nemá možnost měnit režim, logika je automatická dle datového typu hodnot

---

## **Edge Case a UX návrhy**
- Pokud není načten validní JSON → zobrazit chybové hlášení
- Pokud pole obsahuje objekt nebo složenou strukturu → použít dot-notaci (`a.b.c`)
- Není vybráno žádné pole pro zobrazení → zobrazit upozornění
- Není nastavený filtr/sort/search → odpovídající UI komponenta se nezobrazí

---

## **Předpoklady**
- Aplikace běží pouze v prohlížeči
- Uživatel si přináší vlastní JSON data
- Nejsou ukládány žádné údaje do localStorage nebo na server

---

## **Možné rozšíření v budoucnu**
- Možnost exportu filtrovaných výsledků jako JSON nebo CSV
- Podpora bookmarků / konfigurace UI rozhraní
- Lokální cache naposledy načteného souboru

---

Chceš, abych z tohoto PRD připravil rovnou konkrétní kódovou strukturu pro vývoj?