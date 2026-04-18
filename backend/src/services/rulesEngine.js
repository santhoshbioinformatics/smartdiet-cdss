const { mapAllergiesToRestrictions } = require('./allergyService')

// ─── Diet Rules (13 evidence-based rules) ──────────────

const DIET_RULES = [
  {
    id: 'lactose_free', name: 'Lactose-Free Diet',
    triggers: { restrictions: ['lactose'] },
    priority: 4, confidence: 'high',
    rationale: 'Lactase deficiency requires complete dairy elimination to prevent osmotic diarrhea and GI distress.',
    evidence: [{ source: 'NIH', ref: 'NIH Consensus on Lactose Intolerance and Health (2010)' }],
    recommendedOrder: 'lactose_free'
  },
  {
    id: 'gluten_free', name: 'Gluten-Free Diet',
    triggers: { restrictions: ['gluten'] },
    priority: 6, confidence: 'high',
    rationale: 'Celiac disease requires strict gluten elimination. Even trace exposure causes villous atrophy.',
    evidence: [{ source: 'NIH NIDDK', ref: 'Celiac Disease — NIDDK' }, { source: 'FDA', ref: 'FDA 21 CFR 101.91 Gluten-Free Labeling' }],
    recommendedOrder: 'gluten_free'
  },
  {
    id: 'nut_free', name: 'Nut-Free Diet',
    triggers: { restrictions: ['nut'] },
    priority: 5, confidence: 'high',
    rationale: 'Nut allergy carries anaphylaxis risk. Strict elimination and cross-contamination protocols required.',
    evidence: [{ source: 'FDA', ref: 'FALCPA Food Allergen Labeling' }],
    recommendedOrder: 'nut_free'
  },
  {
    id: 'consistent_carb', name: 'Consistent Carbohydrate Diet',
    triggers: { conditions: ['Type 2 Diabetes Mellitus', 'Type 1 Diabetes Mellitus', 'Gestational Diabetes'] },
    priority: 3, confidence: 'high',
    rationale: 'ADA 2024: carbohydrate consistency across meals facilitates insulin adjustment and glycemic stability. Target 45-60g carbs/meal.',
    evidence: [{ source: 'ADA', ref: 'ADA Standards of Medical Care in Diabetes 2024' }],
    recommendedOrder: 'consistent_carb'
  },
  {
    id: 'low_sodium', name: 'Low Sodium Diet (<2g/day)',
    triggers: { conditions: ['Hypertension', 'Heart Failure', 'Hypertension (Stage 1)', 'Hypertension (Stage 2)'] },
    priority: 2, confidence: 'high',
    rationale: 'DASH diet targets <2300mg sodium/day. Meta-analyses show significant BP reduction with dietary sodium restriction.',
    evidence: [{ source: 'NIH NHLBI', ref: 'DASH Eating Plan — NHLBI' }],
    recommendedOrder: 'low_sodium'
  },
  {
    id: 'renal', name: 'Renal Diet',
    triggers: { conditions: ['Chronic Kidney Disease (Stage 3b)', 'Chronic Kidney Disease (Stage 4)', 'End Stage Renal Disease'] },
    priority: 5, confidence: 'moderate',
    rationale: 'KDOQI guidelines: restrict phosphorus, potassium, sodium. Protein 0.6-0.8g/kg/day in advanced CKD. RD consult required.',
    evidence: [{ source: 'NKF', ref: 'KDOQI Clinical Practice Guidelines for Nutrition in CKD' }],
    recommendedOrder: 'renal', requiresRD: true
  },
  {
    id: 'low_fat', name: 'Low Fat Diet',
    triggers: { conditions: ['Hyperlipidemia', 'Coronary Artery Disease', 'Post-CABG'] },
    priority: 2, confidence: 'high',
    rationale: 'ACC/AHA guidelines recommend dietary fat restriction to reduce LDL and cardiovascular risk.',
    evidence: [{ source: 'ACC/AHA', ref: 'ACC/AHA Guideline on Lifestyle Management 2019' }],
    recommendedOrder: 'low_fat'
  },
  {
    id: 'fluid_restriction', name: 'Fluid Restriction (1.5L/day)',
    triggers: { conditions: ['Heart Failure', 'End Stage Renal Disease', 'Cirrhosis with Ascites'] },
    priority: 5, confidence: 'high',
    rationale: 'Fluid restriction prevents volume overload in decompensated heart failure and ESRD. 1.5L/day standard.',
    evidence: [{ source: 'AHA', ref: 'AHA Heart Failure Guidelines 2022' }],
    recommendedOrder: 'fluid_restriction', requiresRD: true
  },
  {
    id: 'mechanical_soft', name: 'Mechanical Soft Diet',
    triggers: { restrictions: ['texture'], conditions: ['Dysphagia', 'Post-Stroke Dysphagia'] },
    priority: 4, confidence: 'high',
    rationale: 'IDDSI framework: texture modification reduces aspiration risk. SLP evaluation recommended.',
    evidence: [{ source: 'IDDSI', ref: 'International Dysphagia Diet Standardisation Initiative 2019' }],
    recommendedOrder: 'mechanical_soft', requiresRD: true
  },
  {
    id: 'high_protein', name: 'High Protein Diet',
    triggers: { conditions: ['Pressure Ulcer Stage 3', 'Pressure Ulcer Stage 4', 'Severe Burns', 'Post-Surgical Recovery'] },
    priority: 3, confidence: 'moderate',
    rationale: 'EPUAP/NPUAP guidelines: 1.25-1.5g protein/kg/day for wound healing. Adequate calories essential.',
    evidence: [{ source: 'EPUAP', ref: 'International Pressure Ulcer Prevention Guidelines 2019' }],
    recommendedOrder: 'high_protein'
  },
  {
    id: 'npo', name: 'NPO (Nothing by Mouth)',
    triggers: { conditions: ['Pre-operative', 'Acute Pancreatitis', 'Bowel Obstruction', 'Active GI Bleed'] },
    priority: 7, confidence: 'high',
    rationale: 'NPO required pre-operatively and in acute GI conditions. Prevents aspiration and allows bowel rest.',
    evidence: [{ source: 'ASA', ref: 'ASA Practice Guidelines for Preoperative Fasting 2017' }],
    recommendedOrder: 'npo', requiresRD: true
  },
  {
    id: 'low_fiber', name: 'Low Fiber Diet',
    triggers: { restrictions: ['low_fiber'], conditions: ['Crohns Disease Active', 'Post-Bowel Surgery', 'Bowel Obstruction Risk'] },
    priority: 3, confidence: 'high',
    rationale: 'Low residue diet reduces bowel stimulation during flares and post-surgical recovery.',
    evidence: [{ source: 'ACG', ref: 'ACG Clinical Guideline: Crohns Disease 2018' }],
    recommendedOrder: 'low_fiber'
  },
  {
    id: 'diabetic_renal', name: 'Diabetic-Renal Diet',
    triggers: { conditions: ['Type 2 Diabetes Mellitus', 'Chronic Kidney Disease (Stage 3b)'] },
    priority: 6, confidence: 'moderate',
    rationale: 'Combined CKD + diabetes requires carbohydrate consistency AND phosphorus/potassium restriction. Complex — mandatory RD consult.',
    evidence: [{ source: 'ADA/NKF', ref: 'Consensus Report: Nutrition in CKD and Diabetes 2022' }],
    recommendedOrder: 'renal', requiresRD: true
  },
  {
    id: 'clear_liquid', name: 'Clear Liquid Diet',
    triggers: { conditions: ['Post-Operative Day 0', 'Colonoscopy Prep', 'Acute Nausea/Vomiting'] },
    priority: 4, confidence: 'high',
    rationale: 'Clear liquids allow GI rest while maintaining hydration. Transition diet only — not nutritionally complete beyond 24-48h.',
    evidence: [{ source: 'ASPEN', ref: 'ASPEN Clinical Guidelines: Nutrition Support in Hospitalized Adults 2021' }],
    recommendedOrder: 'clear_liquid'
  }
]

// ─── Conflict Detection Rules ──────────────────────────

const CONFLICT_RULES = [
  {
    id: 'lactose_regular',
    dietOrders: ['regular', 'standard'],
    restrictions: ['lactose'],
    severity: 'high',
    title: 'Lactose Intolerance × Regular Diet',
    description: 'Regular diet includes dairy. Patient lacks lactase enzyme.',
    risk: 'Osmotic diarrhea, bloating, GI distress, compromised nutrition.',
    alternative: 'Lactose-Free Diet', alternativeValue: 'lactose_free',
    source: 'NIH Consensus on Lactose Intolerance 2010'
  },
  {
    id: 'gluten_regular',
    dietOrders: ['regular', 'standard', 'low_sodium', 'low_fat'],
    restrictions: ['gluten'],
    severity: 'critical',
    title: 'CRITICAL: Celiac Disease × Standard Diet',
    description: 'Gluten-containing foods cause immune-mediated intestinal injury in celiac patients.',
    risk: 'Villous atrophy, malabsorption, long-term lymphoma risk.',
    alternative: 'Gluten-Free Diet', alternativeValue: 'gluten_free',
    source: 'NIH NIDDK Celiac Disease Guidelines'
  },
  {
    id: 'nut_allergy_regular',
    dietOrders: ['regular', 'standard', 'high_protein'],
    restrictions: ['nut'],
    severity: 'critical',
    title: 'CRITICAL: Nut Allergy × Current Diet',
    description: 'Patient has nut allergy. Current diet may contain nut products or cross-contamination risk.',
    risk: 'Anaphylaxis — potentially fatal. Epinephrine auto-injector must be available.',
    alternative: 'Nut-Free Diet', alternativeValue: 'nut_free',
    source: 'FALCPA Food Allergen Labeling'
  },
  {
    id: 'renal_high_k',
    dietOrders: ['vegetarian', 'vegan'],
    conditions: ['Chronic Kidney Disease (Stage 3b)', 'Chronic Kidney Disease (Stage 4)', 'End Stage Renal Disease'],
    severity: 'moderate',
    title: 'CKD × Plant-Based Diet (Hyperkalemia Risk)',
    description: 'Plant-based diets are high in potassium. CKD impairs potassium excretion.',
    risk: 'Hyperkalemia → cardiac arrhythmia risk.',
    alternative: 'Renal Diet with RD Consult', alternativeValue: 'renal',
    source: 'KDOQI Guidelines NKF'
  },
  {
    id: 'npo_oral',
    dietOrders: ['regular', 'standard', 'mechanical_soft', 'clear_liquid', 'lactose_free', 'gluten_free'],
    conditions: ['Pre-operative', 'Bowel Obstruction', 'Active GI Bleed'],
    severity: 'critical',
    title: 'CRITICAL: Oral Diet Ordered — NPO Condition Present',
    description: 'Patient has a condition requiring NPO. Any oral diet order is contraindicated.',
    risk: 'Aspiration risk, surgical complication, worsening of GI bleed.',
    alternative: 'NPO', alternativeValue: 'npo',
    source: 'ASA Preoperative Fasting Guidelines 2017'
  },
  {
    id: 'fluid_restrict_high',
    dietOrders: ['regular', 'standard', 'low_sodium'],
    conditions: ['Heart Failure', 'End Stage Renal Disease'],
    severity: 'high',
    title: 'Fluid-Restricted Condition — No Restriction Ordered',
    description: 'Patient has a condition requiring fluid restriction. Current order does not include it.',
    risk: 'Volume overload, pulmonary edema, worsening cardiac/renal function.',
    alternative: 'Fluid Restriction 1.5L/day added', alternativeValue: 'fluid_restriction',
    source: 'AHA Heart Failure Guidelines 2022'
  }
]

// ─── Engine Functions ───────────────────────────────────

/**
 * Run the diet rules engine against a patient profile.
 * Accepts patient data with allergies already merged into restrictions.
 *
 * @param {Object} patient - { conditions: string[], restrictions: string[] }
 * @returns {Array} Matched rules sorted by priority (highest first)
 */
function runRulesEngine(patient) {
  const matched = []
  for (const rule of DIET_RULES) {
    let match = false

    // Check restriction-based triggers
    if (rule.triggers.restrictions) {
      match = rule.triggers.restrictions.some(r => patient.restrictions.includes(r))
    }

    // Check condition-based triggers
    if (!match && rule.triggers.conditions) {
      match = rule.triggers.conditions.some(c => patient.conditions.includes(c))
    }

    // Special: combo rules (e.g., diabetic_renal) need ALL conditions
    if (rule.id === 'diabetic_renal' && rule.triggers.conditions) {
      match = rule.triggers.conditions.every(c => patient.conditions.includes(c))
    }

    if (match) matched.push(rule)
  }
  matched.sort((a, b) => b.priority - a.priority)
  return matched
}

/**
 * Detect conflicts between a proposed diet order and patient profile.
 *
 * @param {Object} patient - { conditions: string[], restrictions: string[] }
 * @param {string} dietOrder - The proposed diet type string
 * @returns {Array} Detected conflict rules
 */
function detectConflicts(patient, dietOrder) {
  const conflicts = []
  const normalizedOrder = dietOrder.toLowerCase().replace(/\s+/g, '_')

  for (const rule of CONFLICT_RULES) {
    const orderMatch = rule.dietOrders.some(d =>
      normalizedOrder.includes(d) || d.includes(normalizedOrder)
    )
    if (!orderMatch) continue

    const restrictionMatch = rule.restrictions
      ? rule.restrictions.some(r => patient.restrictions.includes(r))
      : false
    const conditionMatch = rule.conditions
      ? rule.conditions.some(c => patient.conditions.includes(c))
      : false

    if (restrictionMatch || conditionMatch) conflicts.push(rule)
  }
  return conflicts
}

/**
 * Score the confidence level for a rule match, factoring in
 * patient complexity and allergy count.
 *
 * @param {Object} rule - A matched diet rule
 * @param {Object} patient - Patient profile
 * @param {number} allergyCount - Number of active allergies
 * @returns {number} Confidence score 40-98
 */
function scoreConfidence(rule, patient, allergyCount = 0) {
  const scores = { high: 90, moderate: 70, review: 50 }
  let base = scores[rule.confidence] || 70

  // Complexity adjustments
  if (patient.conditions.length > 3) base -= 5
  if (patient.restrictions.length > 2) base -= 3
  if (rule.requiresRD) base -= 5
  if (allergyCount > 3) base -= 3

  // Boost for exact allergy-to-restriction match
  if (rule.triggers.restrictions && rule.triggers.restrictions.length === 1) {
    base += 3
  }

  return Math.max(40, Math.min(98, base))
}

/**
 * Build a complete recommendation for a patient, including
 * allergy-derived restrictions.
 *
 * @param {Object} patient - Full patient object from DB (with allergies included)
 * @returns {Object} Full recommendation result
 */
function buildRecommendation(patient) {
  const allergies = patient.allergies || []
  const allergyRestrictions = mapAllergiesToRestrictions(allergies.filter(a => a.status === 'ACTIVE'))

  // Merge patient restrictions with allergy-derived restrictions
  const allRestrictions = [...new Set([...patient.restrictions, ...allergyRestrictions])]

  const enrichedPatient = {
    ...patient,
    restrictions: allRestrictions
  }

  const matchedRules = runRulesEngine(enrichedPatient)

  if (matchedRules.length === 0) {
    return {
      primaryRecommendation: 'Regular Diet',
      confidence: 95,
      rationale: 'No condition-triggered or allergy-triggered dietary restrictions identified.',
      matchedRules: [],
      allergyDerivedRestrictions: allergyRestrictions,
      totalRestrictions: allRestrictions,
      secondaryOptions: [],
      requiresRDConsult: false
    }
  }

  const primary = matchedRules[0]
  const confidence = scoreConfidence(primary, enrichedPatient, allergies.length)

  return {
    primaryRecommendation: primary.name,
    primaryRuleId: primary.id,
    confidence,
    rationale: primary.rationale,
    evidence: primary.evidence,
    requiresRDConsult: primary.requiresRD || false,
    matchedRules: matchedRules.map(r => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
      confidence: scoreConfidence(r, enrichedPatient, allergies.length),
      rationale: r.rationale,
      evidence: r.evidence,
      requiresRD: r.requiresRD || false,
      recommendedOrder: r.recommendedOrder
    })),
    allergyDerivedRestrictions: allergyRestrictions,
    totalRestrictions: allRestrictions,
    secondaryOptions: matchedRules.slice(1).map(r => r.name)
  }
}

module.exports = {
  runRulesEngine,
  detectConflicts,
  scoreConfidence,
  buildRecommendation,
  DIET_RULES,
  CONFLICT_RULES
}