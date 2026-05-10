export interface Milestone {
  id: string
  title: string
  description: string
  condition: string
  reward?: string
  storyText: string
}

export const MILESTONES: Milestone[] = [
  {
    id: 'erbe',
    title: 'Das Erbe',
    description: 'Du übernimmst das Familienunternehmen.',
    condition: 'start',
    storyText: 'Dein Vater hat das Unternehmen durch Krieg und Entbehrung gerettet. Nun liegt es in deinen Händen. Europa liegt in Trümmern — doch in Trümmern stecken die größten Chancen.',
  },
  {
    id: 'erste_erweiterung',
    title: 'Erster Schritt',
    description: 'Dein erstes eigenes Büro oder eine zweite Abteilung.',
    condition: 'companies >= 2',
    storyText: 'Der erste Schritt in die Eigenständigkeit. Du stellst deinen ersten eigenen Mitarbeiter ein — ein Manager, der auf dich zählt.',
  },
  {
    id: 'erste_stadt',
    title: 'Über die Stadtgrenzen',
    description: 'Expansion in eine zweite Stadt.',
    condition: 'cities >= 2',
    reward: '+5.000 ℛℳ Startkapital',
    storyText: 'Dein Name ist nicht mehr nur in der Heimatstadt bekannt. Die ersten Geschäftspartner aus der Ferne klopfen an deine Tür.',
  },
  {
    id: 'erste_million',
    title: 'Der erste Millionär',
    description: 'Gesamtvermögen überschreitet 1.000.000 ℛℳ.',
    condition: 'netWorth >= 1000000',
    reward: 'Neuer Rivalenstatus',
    storyText: 'Eine Million. Dein Buchhalter legt die Zahlen vor dir ab und nickt. Die Zeitungen beginnen, deinen Namen zu drucken.',
  },
  {
    id: 'erster_rivale_besiegt',
    title: 'Erste Übernahme',
    description: 'Ein Rivale wird von dir übernommen.',
    condition: 'acquisitions >= 1',
    storyText: 'Dein erster großer Coup. Der Rivale stand kurz vor der Insolvenz — du hast zugegriffen. Andere Rivalen beobachten dich jetzt genauer.',
  },
  {
    id: 'boerse',
    title: 'Gang an die Börse',
    description: 'Eine deiner Firmen wird an der Börse notiert.',
    condition: 'listed >= 1',
    storyText: 'Das Parkett der Börse unter deinen Füßen. Dein Unternehmen ist nun öffentlich — und du stehst im Rampenlicht der Aktionäre.',
  },
  {
    id: 'alle_branchen',
    title: 'Diversifizierter Konzern',
    description: 'Du bist in allen 5 Branchen aktiv.',
    condition: 'branches >= 5',
    storyText: 'Vom Handel bis zum Bauwesen — dein Imperium kennt keine Grenzen mehr. Synergien zwischen deinen Firmen beginnen zu wirken.',
  },
  {
    id: 'drei_laender',
    title: 'Europäischer Akteur',
    description: 'Firmen in mindestens 3 Ländern.',
    condition: 'countries >= 3',
    storyText: 'Europa ist dein Markt. Grenzen sind für dich nur noch Formalitäten.',
  },
  {
    id: 'zehn_millionen',
    title: 'Großindustrieller',
    description: 'Gesamtvermögen überschreitet 10.000.000 ℛℳ.',
    condition: 'netWorth >= 10000000',
    storyText: 'Die Wirtschaftszeitung porträtiert dich auf der Titelseite. Du bist kein Unternehmer mehr — du bist ein Industrieller.',
  },
  {
    id: 'funf_staedte',
    title: 'Kontinentale Präsenz',
    description: 'Aktiv in mindestens 5 Städten.',
    condition: 'cities >= 5',
    storyText: 'Von Hamburg bis Wien, von Paris bis Rotterdam. Dein Netz überzieht den Kontinent.',
  },
  {
    id: 'grosser_arbeitgeber',
    title: 'Großer Arbeitgeber',
    description: '500 Mitarbeiter in deinem Konzern.',
    condition: 'employees >= 500',
    storyText: 'Fünfhundert Familien hängen von deinen Entscheidungen ab. Diese Verantwortung ist keine Last — sie ist dein Antrieb.',
  },
  {
    id: 'marshall_plan',
    title: 'Marshall-Plan-Profiteur',
    description: 'Von Marshall-Plan-Geldern profitiert.',
    condition: 'event:marshall_plan',
    storyText: 'Die Amerikaner bringen Geld — und du weißt, wie du es einsetzt. Der Wiederaufbau trägt deinen Stempel.',
  },
  {
    id: 'krise_ueberstanden',
    title: 'Krisenresistent',
    description: 'Eine Rezession ohne Verlust überstanden.',
    condition: 'event:recession_survived',
    storyText: 'Während andere zitterten, hast du die Zügel fest gehalten. Die Krise hat dich stärker gemacht.',
  },
  {
    id: 'synergien',
    title: 'Meister der Synergien',
    description: 'Synergievorteil in 3 Branchen gleichzeitig aktiv.',
    condition: 'synergies >= 3',
    storyText: 'Deine Transportfirma beliefert deine Fabrik, die deine Hotels ausstattet. Das Imperium arbeitet für sich selbst.',
  },
  {
    id: 'hundert_millionen',
    title: 'Der Magnat',
    description: 'Gesamtvermögen überschreitet 100.000.000 ℛℳ.',
    condition: 'netWorth >= 100000000',
    storyText: 'Magnaten schütteln dir die Hand. Staatsmänner kennen deinen Namen. Das Familienunternehmen ist Geschichte — du bist Legende.',
  },
]
