import { useCallback, useSyncExternalStore } from 'react'

/**
 * Farmer-facing strings live here so a second language is a dictionary, not a
 * rewrite. Telugu entries are a draft for native review before the pilot.
 */
export type Lang = 'en' | 'te'

const DICT = {
  en: {
    myFarm: 'My farm',
    trees: 'Trees',
    alive: 'Alive',
    needsAttention: 'Needs attention',
    dead: 'Dead',
    paymentsPending: 'Payments pending',
    paid: 'Paid',
    recordMeasurement: 'Record measurement',
    waitingToSync: 'measurements waiting to sync',
    syncNow: 'Sync now',
    offline: 'Offline. Readings are saved on this phone and sent when you are back online.',
    whichTree: 'Which tree?',
    scanTag: 'Scan the tag',
    orTypeId: 'or type the tree ID',
    confirmTree: 'Confirm tree',
    notYourTree: 'This tree is not on your farm.',
    measure: 'Measure',
    measureHelp: 'Wrap the tape flat around the trunk at the marked height and read the number.',
    girthCm: 'Girth (cm)',
    heightCm: 'Height of measurement (cm)',
    standardHeight: 'Standard is 130 cm; use 30 cm for short saplings.',
    lastVerified: 'Last verified',
    takePhoto: 'Take a photo of the tape on the trunk',
    retakePhoto: 'Retake photo',
    photoAttached: 'Photo attached',
    location: 'Location',
    locating: 'Finding your location',
    locationCaptured: 'Location captured',
    locationUnavailable: 'Location not available; the reading will be checked by hand.',
    submit: 'Submit for verification',
    submitting: 'Sending',
    submitted: 'Sent. It will count once Girth verifies it.',
    savedOffline: 'Saved on this phone. It will be sent when you are back online.',
    anotherTree: 'Measure another tree',
    backToFarm: 'Back to my farm',
    yourTrees: 'Your trees',
    pending: 'Pending',
    growth: 'growth',
    signOut: 'Sign out',
    language: 'Language',
  },
  te: {
    myFarm: 'నా పొలం',
    trees: 'చెట్లు',
    alive: 'బతికి ఉన్నవి',
    needsAttention: 'శ్రద్ధ అవసరం',
    dead: 'చనిపోయినవి',
    paymentsPending: 'రావాల్సిన చెల్లింపులు',
    paid: 'చెల్లించినవి',
    recordMeasurement: 'కొలత నమోదు చేయండి',
    waitingToSync: 'కొలతలు పంపడానికి వేచి ఉన్నాయి',
    syncNow: 'ఇప్పుడు పంపండి',
    offline: 'ఆఫ్‌లైన్. కొలతలు ఈ ఫోన్‌లో భద్రపరచబడ్డాయి; నెట్ వచ్చాక పంపబడతాయి.',
    whichTree: 'ఏ చెట్టు?',
    scanTag: 'ట్యాగ్ స్కాన్ చేయండి',
    orTypeId: 'లేదా చెట్టు ID టైప్ చేయండి',
    confirmTree: 'చెట్టును నిర్ధారించండి',
    notYourTree: 'ఈ చెట్టు మీ పొలంలో లేదు.',
    measure: 'కొలవండి',
    measureHelp: 'గుర్తు పెట్టిన ఎత్తు వద్ద టేపును కాండం చుట్టూ చదునుగా చుట్టి సంఖ్యను చదవండి.',
    girthCm: 'చుట్టుకొలత (సెం.మీ)',
    heightCm: 'కొలత ఎత్తు (సెం.మీ)',
    standardHeight: 'ప్రామాణికం 130 సెం.మీ; చిన్న మొక్కలకు 30 సెం.మీ.',
    lastVerified: 'చివరిగా ధృవీకరించినది',
    takePhoto: 'కాండంపై టేపు ఫోటో తీయండి',
    retakePhoto: 'మళ్లీ ఫోటో తీయండి',
    photoAttached: 'ఫోటో జత చేయబడింది',
    location: 'స్థానం',
    locating: 'మీ స్థానాన్ని కనుగొంటోంది',
    locationCaptured: 'స్థానం నమోదైంది',
    locationUnavailable: 'స్థానం అందుబాటులో లేదు; కొలతను చేతితో తనిఖీ చేస్తారు.',
    submit: 'ధృవీకరణకు పంపండి',
    submitting: 'పంపుతోంది',
    submitted: 'పంపబడింది. Girth ధృవీకరించాక లెక్కలోకి వస్తుంది.',
    savedOffline: 'ఈ ఫోన్‌లో భద్రపరచబడింది. నెట్ వచ్చాక పంపబడుతుంది.',
    anotherTree: 'మరో చెట్టును కొలవండి',
    backToFarm: 'నా పొలానికి తిరిగి',
    yourTrees: 'మీ చెట్లు',
    pending: 'పెండింగ్',
    growth: 'పెరుగుదల',
    signOut: 'సైన్ అవుట్',
    language: 'భాష',
  },
} as const

export type StringKey = keyof (typeof DICT)['en']

const STORAGE_KEY = 'girth.lang'
const listeners = new Set<() => void>()

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'te' ? 'te' : 'en'
  } catch {
    return 'en'
  }
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage blocked: language falls back to English each load
  }
  listeners.forEach((l) => l())
}

export function useLang(): [Lang, (lang: Lang) => void] {
  const lang = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    readLang,
    () => 'en' as Lang,
  )
  return [lang, setLang]
}

export function useT() {
  const [lang] = useLang()
  return useCallback((key: StringKey): string => DICT[lang][key] ?? DICT.en[key], [lang])
}
