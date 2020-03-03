// TODO: Replace this data with your own.
// It is organized by language/locale.  You can safely ignore the locales you aren't using.
// Update the name and messages to align with the theme of your skill
const deData = {
  translation: {
    SKILL_NAME: 'Weltraumwissen',
    GET_FACT_MESSAGE: 'Hier sind deine Fakten: ',
    HELP_MESSAGE: 'Du kannst sagen, „Nenne mir einen Fakt über den Weltraum“, oder du kannst „Beenden“ sagen... Wie kann ich dir helfen?',
    HELP_REPROMPT: 'Wie kann ich dir helfen?',
    FALLBACK_MESSAGE: 'Die Weltraumfakten Skill kann dir dabei nicht helfen. Sie kann dir Fakten über den Raum erzählen, wenn du dannach fragst.',
    FALLBACK_REPROMPT: 'Wie kann ich dir helfen?',
    ERROR_MESSAGE: 'Es ist ein Fehler aufgetreten.',
    STOP_MESSAGE: 'Auf Wiedersehen!',
    FACTS: [
      'Ein Jahr dauert auf dem Merkur nur 88 Tage.',
      'Die Venus ist zwar weiter von der Sonne entfernt, hat aber höhere Temperaturen als Merkur.',
      'Venus dreht sich entgegen dem Uhrzeigersinn, möglicherweise aufgrund eines früheren Zusammenstoßes mit einem Asteroiden.',
      'Auf dem Mars erscheint die Sonne nur halb so groß wie auf der Erde.',
      'Jupiter hat den kürzesten Tag aller Planeten.',
    ],
  },
};
const dedeData = {
  translation: {
    SKILL_NAME: 'Weltraumwissen auf Deutsch',
  },
};
const enData = {
  translation: {
    SKILL_NAME: 'Virus News',
    GET_FACT_MESSAGE: 'Here\'s your fact: ',
    HELP_MESSAGE: 'You can say advice me, or, get world statistic, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    FALLBACK_MESSAGE: 'The Space Facts skill can\'t help you with that.  It can help you discover facts about space if you say tell me a space fact. What can I help you with?',
    FALLBACK_REPROMPT: 'What can I help you with?',
    ERROR_MESSAGE: 'Sorry, an error occurred.',
    STOP_MESSAGE: 'Goodbye!',
    PROTECTION_ADVICE: [
      'Wash your hands frequently with soap and water or use an alcohol-based hand rub if your hands are not visibly dirty.',
      'When coughing and sneezing, cover mouth and nose with flexed elbow or tissue – discard tissue immediately into a closed bin and clean your hands with alcohol-based hand rub or soap and water.',
      'Maintain at least 1 metre (3 feet) distance between yourself and other people, particularly those who are coughing, sneezing and have a fever.',
      'Avoid touching eyes, nose and mouth',
      'Tell your health care provider if you have traveled in an area in China where 2019-nCoV has been reported, or if you have been in close contact with someone with who has traveled from China and has respiratory symptoms.'
    ],
  },
};
const enauData = {
  translation: {
    SKILL_NAME: 'Coronavirus News',
  },
};
const encaData = {
  translation: {
    SKILL_NAME: 'Virus News',
  },
};
const engbData = {
  translation: {
    SKILL_NAME: 'Virus News',
  },
};
const eninData = {
  translation: {
    SKILL_NAME: 'Virus News',
  },
};
const enusData = {
  translation: {
    SKILL_NAME: 'Virus News',
  },
};

// constructs i18n and l10n data structure
const languageStrings = {
  // 'de': deData,
  // 'de-DE': dedeData,
  'en': enData,
  'en-AU': enauData,
  'en-CA': encaData,
  'en-GB': engbData,
  'en-IN': eninData,
  'en-US': enusData,
  // 'es': esData,
  // 'es-ES': esesData,
  // 'es-MX': esmxData,
  // 'es-US': esusData,
  // 'fr': frData,
  // 'fr-FR': frfrData,
  // 'fr-CA': frcaData,
  // 'hi': hiData,
  // 'hi-IN': hiinData,
  // 'it': itData,
  // 'it-IT': ititData,
  // 'ja': jpData,
  // 'ja-JP': jpjpData,
  // 'pt': ptData,
  // 'pt-BR': ptbrData,
};
exports.languageStrings = languageStrings;
