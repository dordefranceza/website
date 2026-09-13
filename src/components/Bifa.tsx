/**
 * Bifa de reusita, desenata de mana.
 *
 * Inainte era iconita `solar:check-circle-bold` intr-un cerc verde deschis.
 * Artiom, uitandu-se la ecranul de confirmare: „pare prea basic, poti sa o
 * generam in stilul website-ului?". Avea dreptate, era o iconita de interfata
 * pusa in mijlocul unei pagini desenate cu carioca.
 *
 * NU se genereaza ca poza. O bifa e doua linii: ca imagine ar fi zeci de
 * kiloocteti, ar iesi neclara pe ecran retina si ar trebui refacuta la fiecare
 * schimbare de culoare. Ca SVG cantareste cat un rand de text, ramane clara la
 * orice marime si isi ia culoarea din clasa parintelui.
 *
 * Ce o face sa arate desenata, si nu geometrica:
 *
 * 1. Cercul nu e un cerc. Razele difera cu 2-3 pixeli intre ele, iar punctele
 *    de control ale curbelor nu sunt simetrice. Un `<circle>` perfect se vede
 *    imediat ca facut de masina.
 * 2. Linia trece putin peste locul de unde a plecat, ultima curba. Asa face
 *    mana cand inchide un cerc dintr-o miscare: nu se opreste exact, continua
 *    un pic. Detaliul asta face mai mult decat toate celelalte la un loc.
 * 3. Capetele sunt rotunde, ca varful unei carioci, si bifa e usor curbata, nu
 *    din doua segmente drepte.
 */
export function Bifa({ marime = 80, class: clasa = '' }: { marime?: number; class?: string }) {
  return (
    <svg
      width={marime}
      height={marime}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clasa}
    >
      {/* cercul, cu razele inegale si cu coada care trece peste inceput */}
      <path
        d="M52.5 14.2C79 11.5 106.5 32 106 59.5c-.5 26.5-22.5 47.5-48 46.5C33 105 13.8 84 14.2 58.8 14.6 34 33.5 15.2 56.5 13.6c13-.9 25.5 3 34.5 11"
        strokeWidth="7"
      />
      {/* bifa, dintr-o singura miscare, putin curbata */}
      <path d="M39 60.5c4.5 4.5 9 10 13.5 16.5C60.5 63 70 50 82 40" strokeWidth="8" />
    </svg>
  )
}
