vytvor PRD (project requirement document) tak aby pak na zaklade prd bylo mozne zadat vytvoreni funkcnihi a ihned pouzitelneho kodu.

# Databazovy prohlizec

## Pouzit technologie:
- čistý javascript (vanilla js), bez frameworku
- responsivni jednoduchy design s modernim vzhledem
- UI elementy - tam kde to dava smysl definovat nektere UI elementy pomoci class pro snadnejsi znovupouziti a snadnejsi spravu v ramci DOM, pripadne pro snadnejsi prenos ui elementy do jineho projektu (do jine aplikace).
- dark theme

## Vlastnosti aplikace a uzivatelske scenare: 
- Nacteni databaze ze zdroje (souboru)
  - tlacitko, ktere umozni otevrit soubor
  - Uzivatel vybere json soubor a tim nacte json databazi

- Priprava databaze ke zpracovani  
  - json databazi muze byt vice druhu:
    - 1) soubor obsahujici v hlavnim stromu fieldy db_info a collections (v přiloze jsem nahrál můj ukázkový soubor 1). db_info predstavuje hlavičku s obecnými informacemi o databázi. Collections obsahuje objekty, které predstavuji položky databáze. pokud ve fieldu collections najdou více fieldu dají uživateli na výběr který Field respektive kterou collection otevřít jako databázi. Za databazi k dalsimu zpracovani pak povazujeme seznam objektu z dane collection.
    - 2) soubor neobsahuje v hlavnim stromu fieldy db_info a collections (v přiloze jsem nahrál můj ukázkový soubor 2). Potom se predpoklada, ze fieldy databaze se nachazi primo v koreni. Za databazi k dalsimu zpracovani pak povazujem seznam objektu z korenoveho seznamu.
    
- Nastaveni rozhrani databazoveho prohlizece
  - Po otevreni souboru json a po provedene priprave databaze ke zpracovani, ale jeste pred zobrazenim db, bude nasledovat krok, kdy se projde databaze a vsechny fieldy a zobrazi formular, v expandable ui elementu, kde bude bekolik ui elementu pro 
  
    - prirazovani fieldu k ovladacim prvku prohlizece - search, filter1, filter2, filter3, sort1, sort2 - pro kazdy ovladaci prvek se zobrazi dropdown obsahujici seznam unikatnich fieldu serazeny abecedne
    - vybrani, ktere fieldy se maji zobrazit na karte polozky databaze - mutli check element se seznamem unikatnich fieldu, uzivatel muze zaskrtnou vice polozek
    - v dropdownech se bude nachazet jako prvni defaultni hodnota "not used", ktera znamena, ze zadany UI element se pak v ovladacich prvcih prohlizece nezobrazi a tim padem se ani nebude aplikovat pri zobrazeni polozek databaze.
    - struktura fieldu v polozce databaze nemusi byt plocha, v takovem pripade se obecne doporucuje v UI zobrazit takovy field jako "cestu s teckovou notaci" napr. field1.field2.field3
    - sort 
      - vsechna nastavene pole budou v jedno drpdownu - jeden vybrany field vegeneruje dve polozky v dropdown, napr. pokud uzivatel namapuje pro sort1 field price, tak do dropdownu sortovani to prida 2 polozky "price (ascending)", "price (descending)". Pokud uzivatel prida do sort2 jeste modified_at, tak to do dropdownu pridat dalsi 2 polozky tak ze finalni dropdown bude vypadat
        - price (ascending)
        - price (descending)
        - modified (ascending)
        - modified (descending)
      - u sortovani vidim vyzvu v datovych typech, jelikoz i kdyz vetsina fieldu bude obsahovat stringy, string muze reprezentovat ruzne zakodovane datove typy, napr. datetime, boolean. Dale field muze obsahovat seznam (array). Toto nemam zatim finalne rozmyslene, prosim o doplneni logiky ci pravidel pro praci s datovymi typy.      

- Zobrazeni polozek databaze a ovladacich prvku
  - nahore se zobrazi pruh s ovladacimi prvky
    - vyhledavaci pole
    - pod vyhledavacim polem budou prvky s filtry
      - pred prvkem bude label obsahujici nazev fieldu 
      - v dropdown pak bude 
        - na prvnim miste vzdy hodnota "---" ktera zanaci ze dany filter neni aplikovan
        - po "---" budou dale vypsany vsechny unikatni hodnoty u daneho fieldu razene abecedne
    - pod prvky s filtry bude prvek se sortovanim
  
- Chovani filtrovani a razeni
  - najdrive vytvorit podmnozinu polozek aplikovanim filtru z filtrovacih prvku
  - po aplikovani filtru zuzit podmnozinu aplikovanim search
  - po aplikovani search aplikovat razeni

## Navazujici prompty
- krok 2
  - Vytvor jeden vysledny HTML soubor, ktery v sobe bude obsahovat HTML, CSS i javascript. Tento soubor a jeho kód musí být připravený pro stažení do zarizeni a okamzite spuštění, tak aby to vše fungovalo bez problémů.