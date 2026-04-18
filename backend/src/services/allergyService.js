/**
 * Maps patient allergies to dietary restriction strings
 * used by the rules engine. This is the bridge between
 * the allergy model and the diet recommendation system.
 */

const ALLERGY_TO_RESTRICTION_MAP = {
  // Dairy / Lactose
  'lactose': 'lactose',
  'dairy': 'lactose',
  'milk': 'lactose',
  'casein': 'lactose',
  'whey': 'lactose',

  // Gluten / Celiac
  'gluten': 'gluten',
  'wheat': 'gluten',
  'barley': 'gluten',
  'rye': 'gluten',
  'celiac': 'gluten',

  // Nuts
  'peanut': 'nut',
  'peanuts': 'nut',
  'tree nut': 'nut',
  'tree nuts': 'nut',
  'almond': 'nut',
  'almonds': 'nut',
  'walnut': 'nut',
  'walnuts': 'nut',
  'cashew': 'nut',
  'cashews': 'nut',
  'pistachio': 'nut',
  'hazelnut': 'nut',
  'macadamia': 'nut',
  'pecan': 'nut',
  'pecans': 'nut',

  // Soy
  'soy': 'soy',
  'soybean': 'soy',
  'soybeans': 'soy',

  // Shellfish
  'shellfish': 'shellfish',
  'shrimp': 'shellfish',
  'crab': 'shellfish',
  'lobster': 'shellfish',

  // Fish
  'fish': 'fish',

  // Eggs
  'egg': 'egg',
  'eggs': 'egg',

  // Texture
  'texture': 'texture',
  'dysphagia': 'texture',

  // Fiber
  'fiber': 'low_fiber',
  'high fiber': 'low_fiber',
}

/**
 * Convert active allergies to restriction strings for the rules engine.
 * Only processes ACTIVE allergies.
 *
 * @param {Array} allergies - Array of Allergy records from Prisma
 * @returns {string[]} - Unique restriction strings
 */
function mapAllergiesToRestrictions(allergies) {
  const restrictions = new Set()

  for (const allergy of allergies) {
    if (allergy.status !== 'ACTIVE') continue

    const substance = allergy.substance.toLowerCase().trim()

    // Direct map lookup
    if (ALLERGY_TO_RESTRICTION_MAP[substance]) {
      restrictions.add(ALLERGY_TO_RESTRICTION_MAP[substance])
      continue
    }

    // Partial match (e.g., "peanut butter" → nut)
    for (const [key, restriction] of Object.entries(ALLERGY_TO_RESTRICTION_MAP)) {
      if (substance.includes(key)) {
        restrictions.add(restriction)
        break
      }
    }
  }

  return Array.from(restrictions)
}

/**
 * Common allergy substances for autocomplete suggestions.
 */
const COMMON_SUBSTANCES = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Lactose', 'Eggs', 'Wheat', 'Gluten',
  'Soy', 'Fish', 'Shellfish', 'Sesame', 'Mustard', 'Celery',
  'Penicillin', 'Sulfonamides', 'Aspirin', 'Ibuprofen',
  'Latex', 'Nickel', 'Pollen', 'Dust mites',
  'Corn', 'Gelatin', 'Red dye', 'Sulfites',
  'Almond', 'Walnut', 'Cashew', 'Pistachio', 'Hazelnut',
  'Shrimp', 'Crab', 'Lobster',
  'Codeine', 'Morphine', 'Contrast dye'
]

const COMMON_REACTIONS = [
  'Anaphylaxis', 'Hives / Urticaria', 'Rash', 'Angioedema',
  'GI Distress', 'Nausea / Vomiting', 'Diarrhea',
  'Respiratory distress', 'Wheezing', 'Bronchospasm',
  'Contact dermatitis', 'Eczema flare',
  'Oral allergy syndrome', 'Itching / Pruritus',
  'Swelling', 'Abdominal pain', 'Bloating'
]

module.exports = {
  mapAllergiesToRestrictions,
  COMMON_SUBSTANCES,
  COMMON_REACTIONS,
  ALLERGY_TO_RESTRICTION_MAP
}
