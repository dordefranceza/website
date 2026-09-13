import { site } from './site'

/* ===========================================================================
 *  TEXTELE PAGINILOR DE ADÂNCIME
 *
 *  Pagina de start rămâne o vitrină: fiecare secțiune spune atât cât să
 *  înțelegi dacă te privește. Cine vrea tot, intră aici.
 *
 *  Regula care ține structura curată: **ce scrie aici nu se repetă pe pagina
 *  de start.** Cardurile de acolo dau titlul și o frază; paginile astea dau
 *  situațiile concrete, ce știi să faci la final și ce te costă.
 *
 *  Tot ce ține de metodă (cum arată o lecție minut cu minut) stă pe /despre/,
 *  nu aici, ca să nu ajungem iar cu același text pe trei adrese.
 * ======================================================================== */

export type Caz = {
  /** trebuie să fie același `scop` ca în `nevoi`, ca formularul să se prefilleze */
  scop: string
  semn: string
  culoare: 'albastru' | 'verde' | 'portocaliu' | 'roz'
  titlu: string
  /** cum arată situația, spusă din experiența lecțiilor */
  paragrafe: string[]
  /** ce știi să faci la final, lucruri verificabile, nu impresii */
  rezultate: string[]
}

export const pentruCe = {
  eticheta: 'Pentru ce ai nevoie de franceză',
  /*
   * Era „Șase motive cu care vin oamenii la mine". La 48px cerea 884 de pixeli
   * si avea 672, deci se rupea in doua randuri. Masurat, nu ghicit.
   *
   * L-am scurtat in loc sa largesc coloana: `max-w-4xl` l-ar fi incaput pe
   * ecran mare, dar intre 768 si 960 de pixeli tot s-ar fi rupt. Cuvantul
   * „sase" nu se pierde, e chiar in randul de dedesubt.
   */
  titlu: 'Cu ce vin oamenii la mine',
  intro:
    'Nu predau «franceză în general». Fiecare plan pleacă de la o situație reală, cu un termen și cu o măsură. Mai jos sunt cele șase cu care vin cei mai mulți, și ce înseamnă fiecare în lecții.',
  final: {
    titlu: 'Nu te regăsești în niciuna?',
    text: 'Se întâmplă des, și nu e o problemă. Hai să vorbim douăzeci de minute, îmi spui ce vrei și îți spun sincer dacă te pot ajuta și cât ar dura.',
  },
  cazuri: [
    {
      scop: 'Job la o firmă franceză',
      semn: 'servieta',
      culoare: 'albastru',
      titlu: 'Vreau un job la o firmă franceză',
      paragrafe: [
        'Cei mai mulți care vin pentru asta înțeleg deja destulă franceză. Se blochează la vorbit, și se blochează exact în momentul care contează: interviul. Nu e o problemă de vocabular, e că nu au spus niciodată cu voce tare frazele alea.',
        'Așa că le spunem. Îmi trimiți anunțul la care aplici și lucrăm pe el: ce te vor întreba, cum îți povestești experiența fără să sune tocit, cum ceri o lămurire când nu ai înțeles întrebarea, ce spui despre salariu. Facem interviul de câteva ori, până nu mai e prima dată.',
        'Pe urmă vine partea de după angajare, care sperie mai puțin dar durează mai mult: emailurile de serviciu, ședința în care trebuie să spui ceva, colegul care vorbește repede la telefon.',
      ],
      rezultate: [
        'Îți povestești experiența în franceză, două minute, fără să citești',
        'Scrii un email de serviciu corect, în zece minute, nu într-o oră',
        'Ceri o repetare sau o lămurire fără să pari pierdut',
      ],
    },
    {
      scop: 'Mutare în Franța, Belgia sau Elveția',
      semn: 'valiza',
      culoare: 'verde',
      titlu: 'Mă mut în Franța, Belgia sau Elveția',
      paragrafe: [
        'Aici termenul e mereu clar, fiindcă există o dată de plecare. Asta ajută: știm exact cât timp avem și ce trebuie să intre în el.',
        'Prioritatea nu e gramatica, e să te descurci singur în prima lună. Deschiderea contului la bancă, contractul de chirie, medicul de familie, înscrierea copiilor la școală, mersul la primărie pentru acte. Fiecare dintre situațiile astea are vocabularul ei și o formulă de politețe pe care dacă nu o știi, ești tratat altfel.',
        'Lucrăm și partea care nu se învață din manual: ce faci când nu ai înțeles, cum ceri să ți se vorbească mai rar fără să te scuzi de zece ori, și cum suni la un serviciu unde nimeni nu are răbdare.',
      ],
      rezultate: [
        'Rezolvi singur o programare la doctor, pe telefon',
        'Înțelegi un contract de chirie și întrebi ce nu e clar',
        'Te descurci la primărie și la bancă fără să iei pe cineva cu tine',
      ],
    },
    {
      scop: 'BAC, DELF sau DALF',
      semn: 'diploma',
      culoare: 'portocaliu',
      titlu: 'Am BAC-ul, DELF sau DALF',
      paragrafe: [
        'La examene, jumătate din notă se pierde din necunoașterea probei, nu a limbii. Oameni care vorbesc bine iau note mici fiindcă nu știu cât durează fiecare parte, ce se așteaptă de la ei la producția scrisă sau cum se punctează proba orală.',
        'Începem cu structura: câte părți are, cât durează fiecare, ce se cere exact și cum se dau punctele. Pe urmă lucrăm pe subiecte din anii trecuți, în condiții de examen, cu ceasul pornit.',
        'Fiecare lucrare scrisă se întoarce corectată, cu explicații pe fiecare greșeală, nu doar cu o notă. Așa vezi tipare: de obicei sunt trei sau patru greșeli pe care le repeți, și dacă le rezolvi pe alea, nota urcă simțitor.',
      ],
      rezultate: [
        'Știi structura probei și îți împarți timpul fără să rămâi descoperit',
        'Ai scris și ai primit corectate cel puțin cinci lucrări complete',
        'Intri la oral știind ce se așteaptă de la tine, nu ghicind',
      ],
    },
    {
      scop: 'Altceva',
      semn: 'rasarit',
      culoare: 'roz',
      titlu: 'Încep de la zero',
      paragrafe: [
        'De la zero înseamnă chiar de la zero, și e în regulă. Nu ai nevoie de nicio bază, de nicio amintire din școală și de niciun manual cumpărat dinainte.',
        'Începem cu pronunția, fiindcă franceza se scrie altfel decât se aude și dacă înveți greșit de la început, dezveți greu. Pe urmă vin primele fraze care chiar se folosesc: te prezinți, întrebi, comanzi, ceri ajutor. Vorbești din prima lecție, prost și cu greșeli, așa cum trebuie.',
        'Româna te ajută mai mult decât crezi. Sunt amândouă limbi romanice, deci recunoști câteva mii de cuvinte fără să le fi învățat, iar structuri care pe un vorbitor de engleză îl chinuie luni întregi, ție ți se par normale.',
      ],
      rezultate: [
        'Citești corect cu voce tare, cu sunetele care nu există în română',
        'Te prezinți și porți o conversație scurtă despre tine',
        'Te descurci într-un magazin, la un hotel și la o cafenea',
      ],
    },
    {
      scop: 'Conversație și călătorii',
      semn: 'balon',
      culoare: 'albastru',
      titlu: 'Înțeleg, dar nu îndrăznesc să vorbesc',
      paragrafe: [
        'Ăsta e cel mai frecvent caz și cel mai nedrept. Ai ani de franceză în spate, înțelegi filme, citești. Dar când trebuie să spui ceva, se face liniște.',
        'Nu e o problemă de cunoștințe, e o problemă de antrenament. Înțelesul și vorbitul sunt două deprinderi diferite, iar tu ai antrenat-o doar pe prima. A doua se antrenează într-un singur fel: vorbind, cu cineva care nu te lasă să te oprești și nu te corectează la fiecare cuvânt.',
        'Lecțiile sunt conversație ghidată pe ce te interesează pe tine: călătorii, filme, cărți, politică, gătit, ce vrei. Notez greșelile și trecem prin ele la final, ca să nu îți rupem ritmul în timp ce vorbești.',
      ],
      rezultate: [
        'Vorbești douăzeci de minute fără să ceri cuvinte în română',
        'Îți dregi singur greșeala din mers, fără să te oprești',
        'Începi tu o conversație cu un străin, nu doar răspunzi',
      ],
    },
    {
      scop: 'Pentru copilul meu',
      semn: 'barcuta',
      culoare: 'verde',
      titlu: 'Pentru copilul meu',
      paragrafe: [
        'Copiii și adolescenții au nevoie de altceva decât adulții: de un motiv să vină, nu de un plan pe săptămâni. Dacă lecția e plictisitoare, nimic din ce urmează nu mai contează.',
        'Cu cei mici lucrăm cu jocuri, povești, imagini și multă vorbire. Cu adolescenții pornim de la ce le place deja, muzică, seriale, jocuri, și de acolo intrăm în limbă. Nota bună la școală vine ca efect, nu ca scop: un copil care înțelege ce se întâmplă la oră nu mai are de ce să ia note mici.',
        'Părinții primesc după fiecare lecție un rând, două, despre ce am lucrat și cum a mers. Fără note de la mine și fără presiune în plus, are destulă la școală.',
      ],
      rezultate: [
        'Vine la lecție fără să fie împins de acasă',
        'Vorbește la oră, nu doar scrie',
        'Îi urcă nota fiindcă înțelege, nu fiindcă a tocit',
      ],
    },
  ] as Caz[],
}

/* ------------------------------------------------------------------------ */

export const cumDecurge = {
  eticheta: 'Cum decurge',
  titlu: 'De la primul mesaj până la a zecea lecție',
  intro:
    'Nimic din ce urmează nu are surprize. Scrie aici tot, de la ce se întâmplă în primele douăzeci de minute până la ce faci dacă vrei să te oprești.',
  etape: [
    {
      numar: '01',
      titlu: 'Îmi scrii, sau îți alegi direct o oră',
      paragrafe: [
        'Poți să îmi scrii pe WhatsApp, pe email sau să îți alegi direct o zi și o oră din calendar. Cel mai rapid e WhatsApp, de obicei răspund în aceeași zi.',
        'Nu ai de completat niciun chestionar lung. Îmi trebuie numele tău, o adresă de email și o frază despre ce vrei să obții. Telefonul e opțional, îl ceri doar dacă preferi să te sun.',
      ],
    },
    {
      numar: '02',
      titlu: 'Discuția de cunoaștere, 20 de minute, gratuită',
      paragrafe: [
        'Ne vedem pe Google Meet. Primele minute vorbim în română, ca să îmi spui ce vrei și până când. Pe urmă trecem în franceză cât să văd unde ești: nu e un test cu note, e o conversație din care îmi dau seama ce știi și ce lipsește.',
        'La final îți spun trei lucruri: de la ce nivel pornești, cât ar dura până unde vrei să ajungi, și dacă eu sunt persoana potrivită. Dacă nu sunt, îți spun asta și îți recomand altceva.',
        'Pleci cu un plan scris chiar dacă nu continui cu mine. Nu e un truc de vânzare, e ce mi-aș fi dorit eu când am început.',
      ],
    },
    {
      numar: '03',
      titlu: 'Planul tău, cu obiective la 4, 8 și 12 lecții',
      paragrafe: [
        'Primești în scris ce vei ști să faci după fiecare etapă. Nu «nivelul A2», ci lucruri verificabile: «la lecția 8 susții singur o programare la doctor, pe telefon».',
        'Planul se schimbă dacă se schimbă viața ta. Dacă ți-a apărut un interviu peste trei săptămâni, lăsăm restul și lucrăm la interviu.',
      ],
    },
    {
      numar: '04',
      titlu: 'Lecțiile',
      paragrafe: [
        `Individual ține ${site.durataLectie} de minute. La grup, ${site.durataGrup}, fiindcă sunteți mai mulți și fiecare trebuie să apuce să vorbească.`,
        'Aceeași structură de fiecare dată, ca să știi mereu unde ești. Materialele vin înainte de lecție și sunt incluse. Rezumatul scris ajunge pe email în aceeași zi, cu ce am lucrat, greșelile notate și tema, dacă vrei temă.',
      ],
    },
    {
      numar: '05',
      titlu: 'Între lecții',
      paragrafe: [
        'Nu ești singur între lecții. Îmi scrii pe WhatsApp când te împiedici de ceva: o frază pe care nu știi cum să o spui, un email pe care trebuie să îl trimiți mâine, un cuvânt auzit într-un film.',
        'Nu e o linie de urgență și nu răspund noaptea, dar în aceeași zi da. Corectarea între lecții e inclusă, nu se plătește separat.',
      ],
    },
  ],
  practic: {
    eticheta: 'Partea practică',
    titlu: 'Lucrurile pe care nu le întreabă nimeni, dar toți vor să le știe',
    intrebari: [
      {
        intrebare: 'Am nevoie de cont ca să intru la lecție?',
        raspuns:
          'Nu. Primești un link de Google Meet, dai clic pe el și ești înăuntru. Merge din browser, fără să instalezi nimic, și merge și de pe telefon, deși pe calculator e mai comod fiindcă vezi ecranul partajat.',
      },
      {
        intrebare: 'Ce trebuie să cumpăr?',
        raspuns:
          'Nimic. Materialele sunt făcute pe situația ta și sunt incluse în preț. Nu există manual de cumpărat, taxă de înscriere sau costuri care apar pe parcurs.',
      },
      {
        intrebare: 'Dacă nu pot ajunge la o lecție?',
        raspuns:
          'Reprogramezi gratuit dacă anunți cu cel puțin 24 de ore înainte. Sub 24 de ore lecția se consideră efectuată, fiindcă ora aia a stat blocată pentru tine. La grup orarul e fix și nu se reprogramează individual, dar primești materialele și rezumatul.',
      },
      {
        intrebare: 'Când și cum plătesc?',
        raspuns:
          'Înainte de lecție, prin transfer bancar sau Revolut. La pachete și la cursul de grup plata se face la început, de aceea scade prețul pe lecție. Nu se cere niciodată plata pe mai multe luni înainte, iar lecțiile pe care nu le faci se returnează integral, oricând.',
      },
      {
        intrebare: 'Dacă după prima lecție văd că nu e pentru mine?',
        raspuns: site.garantie.text,
      },
      {
        intrebare: 'La ce oră se pot ține lecțiile?',
        raspuns:
          'Orele libere le vezi direct în calendar, în fusul României, și îți alegi tu. Dacă nu găsești nimic potrivit, scrie-mi: de obicei se găsește ceva în afara orarului afișat.',
      },
    ],
  },
}
