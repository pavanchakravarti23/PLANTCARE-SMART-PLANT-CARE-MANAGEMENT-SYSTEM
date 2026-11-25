/**
 * Rule-based Plant Care Knowledge Base (Non-AI).
 * Provides general starting care profiles for common home garden and indoor plants.
 * All recommendations are explicitly framed as general guidance rather than
 * soil-sensor measurements or guaranteed requirements.
 */

export const PLANT_CATEGORIES = [
  'Indoor plants',
  'Outdoor plants',
  'Flowering plants',
  'Succulents',
  'Herbs',
  'Trees',
  'Vegetables'
];

export const PLANT_LOCATIONS = [
  'Balcony',
  'Living room',
  'Bedroom',
  'Kitchen',
  'Garden',
  'Terrace'
];

export const SUNLIGHT_PREFERENCES = [
  'Full sun (6+ hrs)',
  'Bright indirect light',
  'Partial sun (3-5 hrs)',
  'Low to medium light'
];

export const CARE_DISCLAIMER =
  'General care guidance only: actual watering and feeding frequency depends on local climate, season, pot size, drainage, and potting mix. PlantCare does not use soil moisture sensors or diagnose diseases.';

export const PLANT_CARE_PROFILES = [
  {
    id: 'tulsi',
    name: 'Tulsi',
    scientificName: 'Ocimum tenuiflorum (Holy Basil)',
    aliases: ['tulsi', 'holy basil', 'ocimum'],
    category: 'Herbs',
    defaultLocation: 'Balcony',
    imageUrl: './images/tulsi.svg',
    wateringIntervalDays: 2,
    wateringGuidance:
      'Keep topsoil lightly moist but never soggy. In warm or dry weather, check soil moisture every 1–2 days and water when the top inch feels dry.',
    sunlightPreference: 'Full sun (6+ hrs)',
    sunlightGuidance:
      'Thrives in 4–6+ hours of morning or direct sunlight. Place near a bright south/east balcony or sunny window.',
    fertilisingIntervalDays: 21,
    fertilisingGuidance:
      'Feed lightly every 3 weeks during active growth with mild organic compost or diluted balanced liquid fertiliser.',
    soilGuidance: 'Well-draining loamy potting mix enriched with organic compost.',
    careTips: [
      'Pinch off emerging flower spikes regularly to encourage bushy leaf growth.',
      'Ensure pot drainage holes remain clear to prevent root rot during monsoon or humid weeks.',
      'Protect from cold winter drafts below 10°C.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'every_2_days', notes: 'Check top inch of soil before watering.' },
      { activityType: 'Pruning', repeatInterval: 'biweekly', notes: 'Pinch flower buds to promote fresh foliage.' },
      { activityType: 'Fertilising', repeatInterval: 'custom', customIntervalDays: 21, notes: 'Apply mild organic compost tea.' }
    ]
  },
  {
    id: 'rose',
    name: 'Rose',
    scientificName: 'Rosa spp.',
    aliases: ['rose', 'rosa', 'gulab'],
    category: 'Flowering plants',
    defaultLocation: 'Garden',
    imageUrl: './images/rose.svg',
    wateringIntervalDays: 2,
    wateringGuidance:
      'Water deeply at the base of the plant rather than overhead on leaves to reduce fungal risk. Typically every 2–3 days depending on heat.',
    sunlightPreference: 'Full sun (6+ hrs)',
    sunlightGuidance:
      'Needs at least 6 hours of direct sunlight daily for healthy blooms and strong stems.',
    fertilisingIntervalDays: 14,
    fertilisingGuidance:
      'Feed every 2–3 weeks during the active blooming season with a balanced rose or phosphorus-rich organic feed.',
    soilGuidance: 'Rich, well-drained soil (slightly acidic to neutral pH 6.0–6.8).',
    careTips: [
      'Deadhead spent blooms just above a 5-leaflet node to stimulate new flowering shoots.',
      'Keep airflow open around branches by pruning weak or crossing stems.',
      'Mulch the base to retain moisture and moderate root temperature.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'every_2_days', notes: 'Water deeply at soil level in the morning.' },
      { activityType: 'Fertilising', repeatInterval: 'biweekly', notes: 'Apply rose feed during active blooming.' },
      { activityType: 'Pruning', repeatInterval: 'weekly', notes: 'Deadhead faded flowers and inspect leaves.' }
    ]
  },
  {
    id: 'aloe-vera',
    name: 'Aloe Vera',
    scientificName: 'Aloe barbadensis miller',
    aliases: ['aloe', 'aloe vera'],
    category: 'Succulents',
    defaultLocation: 'Bedroom',
    imageUrl: './images/aloe-vera.svg',
    wateringIntervalDays: 14,
    wateringGuidance:
      'Allow the potting mix to dry out completely between waterings. Water deeply every 2–3 weeks, and even less frequently in winter.',
    sunlightPreference: 'Bright indirect light',
    sunlightGuidance:
      'Prefers bright indirect light or gentle morning sun. Harsh afternoon sun can scorch leaves brown.',
    fertilisingIntervalDays: 30,
    fertilisingGuidance:
      'Minimal feeding required; a diluted succulent fertiliser once a month in spring and summer is usually sufficient.',
    soilGuidance: 'Gritty cactus/succulent mix with coarse sand or perlite for rapid drainage.',
    careTips: [
      'Never leave standing water in the saucer — succulent roots rot quickly in wet soil.',
      'Use an unglazed terracotta pot to help excess moisture evaporate.',
      'Remove dry outer pups or repot when offsets crowd the container.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'biweekly', notes: 'Confirm soil is 100% dry before watering.' },
      { activityType: 'Sunlight check', repeatInterval: 'weekly', notes: 'Rotate pot a quarter turn for even growth.' },
      { activityType: 'Fertilising', repeatInterval: 'monthly', notes: 'Lightly feed only during spring/summer.' }
    ]
  },
  {
    id: 'money-plant',
    name: 'Money Plant',
    scientificName: 'Epipremnum aureum (Pothos)',
    aliases: ['money plant', 'pothos', 'epipremnum', 'devil ivy'],
    category: 'Indoor plants',
    defaultLocation: 'Living room',
    imageUrl: './images/money-plant.svg',
    wateringIntervalDays: 7,
    wateringGuidance:
      'Water when the top 2 inches of soil feel dry, roughly once every 5–7 days indoors. If grown in water, refresh water weekly.',
    sunlightPreference: 'Bright indirect light',
    sunlightGuidance:
      'Adapts well to bright indirect light and tolerates medium indoor light, though variegation fades in deep shade.',
    fertilisingIntervalDays: 30,
    fertilisingGuidance:
      'Feed monthly during spring and summer using a diluted balanced liquid houseplant fertiliser.',
    soilGuidance: 'Light, airy indoor potting mix with coco peat and perlite.',
    careTips: [
      'Wipe dust off leaves monthly with a damp cloth to keep photosynthesis efficient.',
      'Trim leggy vines just below a node and propagate cuttings in water.',
      'Yellowing lower leaves often indicate overwatering or poor drainage.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'weekly', notes: 'Water when top 2 inches feel dry.' },
      { activityType: 'General maintenance', repeatInterval: 'biweekly', notes: 'Wipe leaves and check vine support.' },
      { activityType: 'Fertilising', repeatInterval: 'monthly', notes: 'Diluted houseplant liquid feed.' }
    ]
  },
  {
    id: 'snake-plant',
    name: 'Snake Plant',
    scientificName: 'Dracaena trifasciata (Sansevieria)',
    aliases: ['snake plant', 'sansevieria', 'mother in law tongue'],
    category: 'Indoor plants',
    defaultLocation: 'Bedroom',
    imageUrl: './images/snake-plant.svg',
    wateringIntervalDays: 14,
    wateringGuidance:
      'Very drought-tolerant. Water sparingly every 2–3 weeks once soil is completely dry down to the root zone.',
    sunlightPreference: 'Low to medium light',
    sunlightGuidance:
      'Tolerates low indoor light corners well, though bright indirect light supports firmer upright foliage.',
    fertilisingIntervalDays: 30,
    fertilisingGuidance:
      'Feed lightly once a month during warm growing months; skip fertilising in winter.',
    soilGuidance: 'Fast-draining cactus or sandy indoor soil mix.',
    careTips: [
      'Overwatering is the most common mistake; err on the dry side.',
      'Avoid pouring water directly into the centre rosette of leaves.',
      'Repot only every 2–3 years when roots visibly press against the pot.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'biweekly', notes: 'Check soil deeply before watering.' },
      { activityType: 'General maintenance', repeatInterval: 'monthly', notes: 'Dust vertical blades gently.' }
    ]
  },
  {
    id: 'spider-plant',
    name: 'Spider Plant',
    scientificName: 'Chlorophytum comosum',
    aliases: ['spider plant', 'chlorophytum'],
    category: 'Indoor plants',
    defaultLocation: 'Living room',
    imageUrl: './images/default-plant.svg',
    wateringIntervalDays: 4,
    wateringGuidance:
      'Prefers lightly moist soil during active growth. Typically water every 4–5 days using filtered or settled water if tap water causes brown tips.',
    sunlightPreference: 'Bright indirect light',
    sunlightGuidance:
      'Bright, filtered indoor light keeps striped leaves vibrant without scorching tips.',
    fertilisingIntervalDays: 21,
    fertilisingGuidance:
      'Feed every 3–4 weeks in spring and summer with half-strength liquid fertiliser.',
    soilGuidance: 'Loose, well-draining general indoor potting mix.',
    careTips: [
      'Trim brown leaf tips cleanly with sharp scissors.',
      'Plantlets ("spiderettes") can be rooted easily in small pots.',
      'Avoid soggy soil around fleshy tuberous roots.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'custom', customIntervalDays: 4, notes: 'Keep lightly moist, not waterlogged.' },
      { activityType: 'Fertilising', repeatInterval: 'custom', customIntervalDays: 21, notes: 'Half-strength liquid feed.' }
    ]
  },
  {
    id: 'peace-lily',
    name: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    aliases: ['peace lily', 'spathiphyllum'],
    category: 'Flowering plants',
    defaultLocation: 'Living room',
    imageUrl: './images/default-plant.svg',
    wateringIntervalDays: 5,
    wateringGuidance:
      'Keep soil evenly moist but not saturated; typically every 4–6 days. Slight leaf droop signals thirst, recovering soon after watering.',
    sunlightPreference: 'Low to medium light',
    sunlightGuidance:
      'Enjoys bright indirect or medium indoor light. Direct sun bleaches leaves.',
    fertilisingIntervalDays: 30,
    fertilisingGuidance:
      'Apply balanced indoor plant food monthly during active spring/summer growth.',
    soilGuidance: 'Moisture-retentive yet aerated indoor peat/coco-perlite mix.',
    careTips: [
      'Mist foliage occasionally in dry air-conditioned rooms.',
      'Cut spent spathes down near the base once they turn green or brown.',
      'Note: sap can irritate pets if chewed; keep out of reach.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'custom', customIntervalDays: 5, notes: 'Water when top inch feels slightly dry.' },
      { activityType: 'General maintenance', repeatInterval: 'biweekly', notes: 'Wipe broad leaves and trim faded blooms.' }
    ]
  },
  {
    id: 'basil',
    name: 'Basil',
    scientificName: 'Ocimum basilicum (Sweet Basil)',
    aliases: ['basil', 'sweet basil'],
    category: 'Herbs',
    defaultLocation: 'Kitchen',
    imageUrl: './images/tulsi.svg',
    wateringIntervalDays: 2,
    wateringGuidance:
      'Sweet basil enjoys consistent moisture without waterlogging. Check soil every 1–2 days and water at the base.',
    sunlightPreference: 'Full sun (6+ hrs)',
    sunlightGuidance:
      'Needs 6 hours of bright sun daily (sunny kitchen windowsill or balcony) for aromatic leaves.',
    fertilisingIntervalDays: 14,
    fertilisingGuidance:
      'Feed every 2–3 weeks with organic liquid herb feed if grown in pots.',
    soilGuidance: 'Fertile, fast-draining herb potting mix.',
    careTips: [
      'Harvest top stem tips above leaf pairs so the plant branches outward.',
      'Pinch flower buds early to preserve leaf flavour.',
      'Water in the morning so foliage stays dry overnight.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'every_2_days', notes: 'Keep soil evenly moist at the base.' },
      { activityType: 'Pruning', repeatInterval: 'weekly', notes: 'Harvest upper tips above a leaf node.' }
    ]
  },
  {
    id: 'hibiscus',
    name: 'Hibiscus',
    scientificName: 'Hibiscus rosa-sinensis',
    aliases: ['hibiscus', 'shoe flower', 'gudhal'],
    category: 'Flowering plants',
    defaultLocation: 'Terrace',
    imageUrl: './images/rose.svg',
    wateringIntervalDays: 2,
    wateringGuidance:
      'Thirsty bloomer during warm months; water deeply every 1–3 days when topsoil dries slightly, reducing in cool weather.',
    sunlightPreference: 'Full sun (6+ hrs)',
    sunlightGuidance:
      'Requires abundant direct sunlight (5–6+ hours) for continuous bud formation.',
    fertilisingIntervalDays: 14,
    fertilisingGuidance:
      'Feed every 2 weeks in warm months with a potassium-balanced flowering fertiliser.',
    soilGuidance: 'Rich, slightly acidic, well-draining garden or container mix.',
    careTips: [
      'Check undersides of leaves regularly for aphids or mealybugs.',
      'Prune lightly in early spring to shape and encourage new flowering tips.',
      'Avoid moving pots abruptly, which can trigger bud drop.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'every_2_days', notes: 'Deep soak when top inch is dry.' },
      { activityType: 'Fertilising', repeatInterval: 'biweekly', notes: 'Potassium-balanced bloom support.' },
      { activityType: 'General maintenance', repeatInterval: 'weekly', notes: 'Inspect leaf undersides for pests.' }
    ]
  },
  {
    id: 'jade-plant',
    name: 'Jade Plant',
    scientificName: 'Crassula ovata',
    aliases: ['jade', 'jade plant', 'crassula'],
    category: 'Succulents',
    defaultLocation: 'Balcony',
    imageUrl: './images/aloe-vera.svg',
    wateringIntervalDays: 10,
    wateringGuidance:
      'Water thoroughly only when the soil is dry to the touch (every 10–14 days). Wrinkled leaves suggest thirst; soft yellowing leaves suggest overwatering.',
    sunlightPreference: 'Bright indirect light',
    sunlightGuidance:
      'Loves 4+ hours of bright light or gentle direct sun; stems stretch if light is too dim.',
    fertilisingIntervalDays: 30,
    fertilisingGuidance:
      'Feed once a month during spring and summer with a diluted succulent formula.',
    soilGuidance: 'Porous succulent mix with pumice or perlite.',
    careTips: [
      'Use a heavy pot to counterbalance its thick, woody canopy as it matures.',
      'Avoid misting leaves.',
      'Pinch stem tips in spring to develop a compact, tree-like form.'
    ],
    suggestedActivities: [
      { activityType: 'Watering', repeatInterval: 'custom', customIntervalDays: 10, notes: 'Wait until soil dries completely.' },
      { activityType: 'Sunlight check', repeatInterval: 'weekly', notes: 'Rotate for balanced canopy growth.' }
    ]
  }
];

const CATEGORY_FALLBACKS = {
  'Indoor plants': { wateringIntervalDays: 7, sunlightPreference: 'Bright indirect light', fertilisingIntervalDays: 30 },
  'Outdoor plants': { wateringIntervalDays: 3, sunlightPreference: 'Full sun (6+ hrs)', fertilisingIntervalDays: 21 },
  'Flowering plants': { wateringIntervalDays: 3, sunlightPreference: 'Full sun (6+ hrs)', fertilisingIntervalDays: 14 },
  Succulents: { wateringIntervalDays: 14, sunlightPreference: 'Bright indirect light', fertilisingIntervalDays: 30 },
  Herbs: { wateringIntervalDays: 2, sunlightPreference: 'Full sun (6+ hrs)', fertilisingIntervalDays: 21 },
  Trees: { wateringIntervalDays: 5, sunlightPreference: 'Full sun (6+ hrs)', fertilisingIntervalDays: 30 },
  Vegetables: { wateringIntervalDays: 2, sunlightPreference: 'Full sun (6+ hrs)', fertilisingIntervalDays: 14 }
};

/**
 * Rule-based matcher: finds the best matching plant care profile
 * by species name/alias, or returns a category-level general fallback.
 *
 * @param {string} queryName
 * @param {string} [category]
 * @returns {{ matched: boolean, profile: object }}
 */
export function recommendCareForPlant(queryName, category = 'Indoor plants') {
  const normalized = String(queryName || '').trim().toLowerCase();

  if (normalized) {
    const exactOrAlias = PLANT_CARE_PROFILES.find(
      (profile) =>
        profile.id === normalized ||
        profile.name.toLowerCase() === normalized ||
        profile.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))
    );
    if (exactOrAlias) {
      return { matched: true, profile: exactOrAlias };
    }
  }

  const fallback = CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS['Indoor plants'];
  return {
    matched: false,
    profile: {
      id: 'custom-category-guide',
      name: queryName || category,
      scientificName: `${category} general guide`,
      category,
      defaultLocation: 'Balcony',
      imageUrl: './images/default-plant.svg',
      wateringIntervalDays: fallback.wateringIntervalDays,
      wateringGuidance: `Check the top 1–2 inches of soil every ${fallback.wateringIntervalDays} days and water thoroughly when dry for this ${category.toLowerCase()} group.`,
      sunlightPreference: fallback.sunlightPreference,
      sunlightGuidance: `Most ${category.toLowerCase()} perform well with ${fallback.sunlightPreference.toLowerCase()}. Observe leaf colour for signs of excess or insufficient light.`,
      fertilisingIntervalDays: fallback.fertilisingIntervalDays,
      fertilisingGuidance: `Apply a balanced organic or diluted liquid feed roughly every ${fallback.fertilisingIntervalDays} days during active growing seasons.`,
      soilGuidance: 'Use a clean container with drainage holes and a well-aerated potting mix suited to the plant group.',
      careTips: [
        'Always verify topsoil moisture with your finger before watering.',
        'Adjust watering intervals across summer, monsoon, and winter seasons.',
        'Keep leaves dust-free and inspect periodically for pests.'
      ],
      suggestedActivities: [
        {
          activityType: 'Watering',
          repeatInterval: 'custom',
          customIntervalDays: fallback.wateringIntervalDays,
          notes: 'Check topsoil moisture before watering.'
        },
        {
          activityType: 'Fertilising',
          repeatInterval: 'custom',
          customIntervalDays: fallback.fertilisingIntervalDays,
          notes: 'General seasonal nutrient top-up.'
        }
      ]
    }
  };
}
