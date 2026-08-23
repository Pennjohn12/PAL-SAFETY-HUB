'use strict';

const HOUSEKEEPING_GUIDANCE = {
  topic: 'Housekeeping',
  requiredPractice: 'Clean as you go. Correct housekeeping hazards immediately instead of waiting until the end of the shift.',
  variations: [
    {
      hazard: 'Slips, trips, and falls from wet, oily, muddy, or debris-covered walking and working surfaces.',
      control: 'Inspect walking and working surfaces before work and as conditions change. Clean spills, mud, and debris promptly; remove scrap materials and tools immediately after use. Keep aisles, stairs, and walkways clear, and stop to correct any surface that cannot be traveled safely.'
    },
    {
      hazard: 'Trip hazards and damaged utilities from cords, hoses, leads, or tools left on floors or routed through walkways.',
      control: 'Route cords, hoses, and leads away from aisles and walking paths whenever possible. Organize and secure them so they do not create loops or trip points. Where a crossing is unavoidable, protect it from foot traffic and equipment damage, mark the crossing when needed, and correct displaced protection immediately.'
    },
    {
      hazard: 'Blocked access or delayed emergency egress caused by materials, equipment, debris, or tools stored in aisles, stairs, exits, and travel paths.',
      control: 'Keep aisles, stairs, exits, and emergency egress routes continuously open. Stage tools, materials, and equipment only in designated areas and never in a path needed for normal access or emergency exit. Recheck travel paths as work changes and relocate obstructions immediately.'
    },
    {
      hazard: 'Struck-by, caught-between, and trip exposure from materials or equipment that are stacked poorly or left unsecured and could shift, roll, or fall.',
      control: 'Store materials in designated areas, stack them securely, and secure loose, round, or unstable items against movement. Keep stored material within a stable footprint and away from access routes. Stop and restack or secure anything that shifts, leans, rolls, or cannot be stored safely.'
    }
  ]
};

function housekeepingPromptGuidance() {
  const choices = HOUSEKEEPING_GUIDANCE.variations
    .map((entry, index) => `${index + 1}. Hazard: ${entry.hazard} Control: ${entry.control}`)
    .join('\n');
  return `- Housekeeping: When Housekeeping is supported by the work plan or selected as the safety topic, choose two distinct, relevant hazard/control pairs from the PAL-approved choices below. Vary the two choices across drafts when multiple choices fit, keep each hazard matched to its control, and adapt only the location/task facts supplied by the user. Always include this practice: ${HOUSEKEEPING_GUIDANCE.requiredPractice}\n${choices}`;
}

module.exports = { HOUSEKEEPING_GUIDANCE, housekeepingPromptGuidance };
