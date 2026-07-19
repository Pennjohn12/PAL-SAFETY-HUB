import fs from 'node:fs/promises';
import path from 'node:path';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const ROOT = 'C:/Users/Pennj/Documents/PAL CO/PAL-SAFETY-HUB';
const OUT_DIR = path.join(ROOT, 'outputs');
const ASSET_DIR = path.join(ROOT, 'assets', 'orientation-scenes');
const QA_DIR = 'C:/Users/Pennj/AppData/Local/Temp/codex-presentations/pal-orientation-slides/tmp/qa';
const FINAL_PPTX = path.join(OUT_DIR, 'PAL_Orientation_Slide_Package_English_v1.pptx');
const FINAL_IMAGE_PPTX = path.join(OUT_DIR, 'PAL_Orientation_Slide_Package_English_v2_with_images.pptx');
const FINAL_VISUAL_PPTX = path.join(OUT_DIR, 'PAL_Orientation_Slide_Package_English_v4_visual_first_revised.pptx');

const navy = '#12385F';
const navy2 = '#0B243D';
const green = '#66C43A';
const gray = '#F3F6F8';
const line = '#D8E1EA';
const text = '#12233A';
const muted = '#5E6B7A';
const danger = '#B42318';
const amber = '#B7791F';

const slides = [
  {
    eyebrow: 'PAL ENVIRONMENTAL SERVICES',
    title: 'Employee Safety Orientation',
    subtitle: 'Understand the rules before entering the jobsite.',
    bullets: ['Safety', 'Compliance', 'Communication'],
    visual: 'Opening PAL title slide with a clean jobsite training look.',
    notes: 'Welcome to PAL Environmental Services orientation. This training introduces the safety expectations, required training records, jobsite rules, and reporting procedures every PAL employee must understand before working on a project.'
  },
  {
    eyebrow: 'ORIENTATION GOALS',
    title: 'PAL safety starts with five expectations.',
    bullets: ['Protect employee health and safety', 'Prevent incidents through planning', 'Keep communication clear'],
    callouts: ['Protection', 'Prevention', 'Education', 'Compliance', 'Communication'],
    visual: 'Show five simple goal words around a supervisor speaking with a crew.',
    notes: 'PAL orientation is built around five goals: protecting employee health and safety, preventing accidents through planning and risk assessment, educating employees, meeting or exceeding safety requirements, and keeping clear communication.'
  },
  {
    eyebrow: 'TRAINING RECORDS',
    title: 'Workers must have the training required for the task.',
    bullets: ['NYC SST or OSHA training when required', 'Fall prevention and scaffold user training when required', 'Fit test and medical clearance before respirator use'],
    visual: 'Safety coordinator reviewing training records with a worker.',
    notes: 'Before working on a PAL project, employees must have the required training records for the work they will perform. Watching this video does not replace those credentials.'
  },
  {
    eyebrow: 'PPE REQUIRED',
    title: 'Minimum PPE is required before work starts.',
    bullets: ['Hard hat, safety glasses, work boots, and long pants', 'High-visibility vest or clothing when required', 'Rated gloves matched to the task'],
    callouts: ['Hard Hat', 'Glasses', 'Gloves', 'Boots', 'Hi-Vis'],
    visual: 'Crew at site entry wearing proper PPE while a supervisor performs a check.',
    notes: 'PAL employees must report to the job prepared with required personal protective equipment. Minimum PPE includes approved head, eye, hand, foot, leg, and visibility protection as required by the site and task.'
  },
  {
    eyebrow: 'TASK-SPECIFIC PPE',
    title: 'Some work requires more protection.',
    bullets: ['Face shields, hearing protection, and coveralls may be required', 'Rubber gloves or boots may be required for specific hazards', 'Respirators require medical clearance, fit test, training, and authorization'],
    visual: 'Show task-specific PPE neatly arranged, with respirator stored properly.',
    notes: 'Depending on the work, additional protection may include a face shield, hearing protection, coveralls, rubber gloves or boots, and respiratory protection.'
  },
  {
    eyebrow: 'RESPIRATORS',
    title: 'Respirators cannot be used without authorization.',
    bullets: ['Medical clearance', 'Annual fit test', 'Training and PAL authorization'],
    accent: danger,
    visual: 'Respirator authorization checklist. Do not show casual respirator use.',
    notes: 'Do not use a respirator until you have received the required medical clearance, annual fit test, training, and authorization.'
  },
  {
    eyebrow: 'FALL PROTECTION',
    title: 'Fall hazards begin at six feet or greater.',
    bullets: ['Open edges, lifts, scaffolds, and walkway gaps', 'Guardrails and hole covers must be installed and secured', 'Barricade below when overhead work creates exposure'],
    visual: 'Guarded edge, secured hole cover, and barricaded work below.',
    notes: 'Fall protection is required when an employee is exposed to a fall hazard of six feet or greater.'
  },
  {
    eyebrow: 'HARNESS INSPECTION',
    title: 'Inspect fall protection before every use.',
    bullets: ['Check harness, lanyard, connectors, and anchor point', 'Use only approved anchor points', 'Stop work if the setup is unclear or defective'],
    visual: 'Worker inspecting harness and tying off to an approved point in a lift.',
    notes: 'Personal fall arrest equipment must be inspected before every use, and anchor points must meet the required rating.'
  },
  {
    eyebrow: 'PAL LADDERS LAST',
    title: 'Portable ladders are the last option.',
    bullets: ['1. Aerial lift', '2. Scaffolding', '3. Podium or platform ladder', '4. Traditional portable ladder only when permitted'],
    accent: green,
    visual: 'Show the PAL Ladder Last hierarchy clearly from safer option to last resort.',
    notes: "PAL takes its Ladders Last Policy seriously. Traditional portable ladders must not be the primary work platform when a safer option is feasible."
  },
  {
    eyebrow: 'LADDER PLANNING',
    title: 'Select access equipment before the task starts.',
    bullets: ['Supervisors choose the safest feasible platform', 'Do not overreach or work outside side rails', 'Stop if the selected equipment is not safe for the work'],
    visual: 'Supervisor and worker choosing access equipment during pre-task planning.',
    notes: 'Supervisors must select the proper access equipment during pre-task planning. If the selected equipment does not allow the work to be performed safely, stop and notify supervision.'
  },
  {
    eyebrow: 'ELECTRICAL SAFETY',
    title: 'Inspect cords and protect against shock.',
    bullets: ['Use heavy-duty grounded cords', 'Use and test GFCI protection', 'Remove damaged electrical equipment from service'],
    visual: 'Worker inspecting cord and testing GFCI; damaged cord tagged out.',
    notes: 'Inspect extension cords, plugs, temporary wiring, and ground-fault circuit interrupters before use.'
  },
  {
    eyebrow: 'TOOLS AND LOTO',
    title: 'Use tools only when trained and protected.',
    bullets: ['Inspect tools, guards, cords, and accessories', 'Disconnect power before changing attachments', 'Lockout/tagout requires authorized personnel'],
    visual: 'Tool inspection beside lock and tag applied to isolated equipment.',
    notes: 'Only trained employees may operate hand and power tools. Hazardous energy must be properly de-energized, verified, locked, and tagged by authorized personnel.'
  },
  {
    eyebrow: 'MATERIAL HANDLING',
    title: 'Plan the lift before touching the load.',
    bullets: ['Know the weight, size, and shape', 'Use pallet jacks, dollies, hoists, forklifts, or team lifting when practical', 'Stop and get help if the load is too heavy or awkward'],
    visual: 'Crew planning a lift and using a pallet jack.',
    notes: "Plan every lift. Know the load's weight, size, and shape. Use mechanical help when practical."
  },
  {
    eyebrow: 'SAFE LIFTING',
    title: 'Keep the load close and avoid twisting.',
    bullets: ['Set your feet before lifting', 'Lift with your legs', 'Secure material so it cannot shift'],
    visual: 'Worker lifting bags from a pallet jack with proper body position.',
    notes: 'Keep the load close, lift with your legs, avoid twisting, secure material against movement, and maintain clear communication.'
  },
  {
    eyebrow: 'FIRE SAFETY',
    title: 'Control ignition sources and keep an exit route.',
    bullets: ['Hot work requires an approved permit and controls', 'Call 911 and evacuate if the fire is too large', 'Use PASS only if trained and conditions allow'],
    visual: 'Hot-work controls, clear extinguisher access, and safe exit path.',
    notes: 'Fire prevention means controlling ignition sources and combustible materials. If a fire is too large to control safely, call 911 and evacuate.'
  },
  {
    eyebrow: 'HOUSEKEEPING',
    title: 'A clean jobsite prevents injuries.',
    bullets: ['Keep walkways, stairs, doors, and emergency equipment clear', 'Clean spills or isolate the area', 'Store materials so they cannot fall, shift, or block access'],
    visual: 'Crew member cleaning debris and keeping the pathway clear.',
    notes: 'Good housekeeping is required every day. Keep access clear, clean spills immediately, and store materials so they do not create hazards.'
  },
  {
    eyebrow: 'HAZCOM AND SDS',
    title: 'Never use an unknown material.',
    bullets: ['Know where SDS and Right-to-Know information are located', 'Every container must be labeled', 'Isolate unlabeled material and notify supervision'],
    visual: 'Worker checking a labeled container against an SDS binder or tablet.',
    notes: 'Hazard Communication and GHS help employees understand chemical hazards. Never use an unknown or unlabeled material.'
  },
  {
    eyebrow: 'SCAFFOLDS',
    title: 'Scaffolds require competent-person inspection.',
    bullets: ['Erected and inspected under competent-person control', 'Daily inspection must be documented', 'Never stand, sit, or rest on guardrails'],
    visual: 'Competent person reviewing scaffold tag and checklist.',
    notes: 'Scaffolds must be erected by a competent person, installed according to manufacturer requirements, and inspected and documented daily.'
  },
  {
    eyebrow: 'LIFTS',
    title: 'Only trained employees may operate lifts.',
    bullets: ['Conduct and document the pre-use inspection', 'Use approved tie-off points when required', 'Keep both feet on the platform floor'],
    visual: 'Scissor lift inspection and worker tied off to designated point.',
    notes: 'Only trained and authorized employees may operate mobile elevating work platforms or scissor lifts.'
  },
  {
    eyebrow: 'HEAVY EQUIPMENT',
    title: 'Stay visible and out of the equipment path.',
    bullets: ['Stay out of blind spots and loading areas', 'Make eye contact with the operator before approaching', 'Watch overhead power lines and underground utilities'],
    visual: 'Worker outside swing radius making eye contact with equipment operator.',
    notes: 'When working near heavy equipment, remain alert and stay out of blind spots and loading areas.'
  },
  {
    eyebrow: 'CONFINED SPACE',
    title: 'This orientation does not authorize entry.',
    bullets: ['Confined spaces require specialized training', 'Hazards may include atmosphere, engulfment, or entrapment', 'Do not enter unless trained, authorized, and equipped'],
    accent: danger,
    visual: 'Permit-required confined-space warning with untrained worker stopped outside.',
    notes: 'Never enter a confined space unless PAL has determined the requirements and you are specifically trained, authorized, and properly equipped.'
  },
  {
    eyebrow: 'ASBESTOS, LEAD, AND SILICA',
    title: 'Specialized hazards require authorized controls.',
    bullets: ['Only trained authorized personnel may disturb asbestos or lead', 'Follow the task-specific silica exposure control plan', 'Use wet methods, HEPA vacuums, dust collection, and PPE as required'],
    visual: 'Controlled regulated area with HEPA vacuum and wet dust control.',
    notes: 'Only authorized and trained personnel may disturb asbestos-containing material or lead. Respirable crystalline silica can cause serious illness and must be controlled.'
  },
  {
    eyebrow: 'ENVIRONMENTAL PROTECTION',
    title: 'Regulated waste does not go in the regular dumpster.',
    bullets: ['Use labeled waste streams and closed containers', 'Keep spill kits where waste is generated', 'Ask supervision before disposal when uncertain'],
    visual: 'Labeled waste containers, spill kit, and supervisor directing disposal.',
    notes: 'Batteries, fluorescent lamps, chemicals, aerosol cans, used oil, and other regulated materials must be handled and disposed of correctly.'
  },
  {
    eyebrow: 'EMERGENCY ACTION PLAN',
    title: 'Know the plan before work begins.',
    bullets: ['Know alarms, emergency contacts, route, and muster point', 'Walk, do not run', 'Remain at the muster point until released'],
    visual: 'Workers calmly walking to a muster point while supervisor takes headcount.',
    notes: 'Every project must post a site-specific Emergency Action Plan. Before beginning work, know the alarms, emergency contacts, evacuation route, and muster point.'
  },
  {
    eyebrow: 'REPORTING',
    title: 'Report incidents and near misses immediately.',
    bullets: ['Injuries, illnesses, property damage, releases, and near misses', 'Report even when it appears minor', 'Same-day review corrects hazards and prevents repeat events'],
    visual: 'Worker calmly reporting a near miss to supervisor.',
    notes: 'All accidents, injuries, illnesses, property damage, environmental releases, and near misses must be reported immediately.'
  },
  {
    eyebrow: 'STOP WORK AUTHORITY',
    title: 'No one has the right to put you in an unsafe situation.',
    bullets: ['Stop the work', 'Move to a safe location', 'Notify supervision'],
    accent: amber,
    visual: 'Worker stopping a task and speaking with foreman before continuing.',
    notes: 'Employees will not be penalized for refusing work they reasonably believe is unsafe. Stop the work, move to a safe location, and notify supervision.'
  },
  {
    eyebrow: 'WORKPLACE RULES',
    title: 'PAL maintains a drug-free and alcohol-free workplace.',
    bullets: ['No alcohol during the workday, including lunch', 'No illegal drugs, controlled substances, or reporting impaired', 'Testing may include pre-assignment, random, post-accident, or reasonable-suspicion testing'],
    visual: 'Drug-free workplace notice and worker signing policy acknowledgement.',
    notes: 'PAL maintains a drug-free and alcohol-free workplace. Employees and applicants must comply with PAL testing policy.'
  },
  {
    eyebrow: 'QUESTIONS',
    title: 'When you are unsure, stop and ask.',
    bullets: ['Supervisor', 'Foreman or general superintendent', 'PAL EH&S representative'],
    visual: 'Foreman answering worker questions during a jobsite meeting.',
    notes: 'Safety depends on communication. When you are uncertain, stop and ask.'
  },
  {
    eyebrow: 'FINAL ACKNOWLEDGEMENT',
    title: 'Orientation is complete only after acknowledgement and review.',
    bullets: ['Watch the full video in the selected language', 'Answer all knowledge checks', 'Sign and submit for PAL review'],
    visual: 'Clean final screen with acknowledgement and PAL review message.',
    notes: 'Require the employee to enter their name, sign, and submit the acknowledgement. Completion does not grant access to a project until the office or authorized reviewer confirms all required credentials.'
  }
];

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function readImageBlob(imageName) {
  const bytes = await fs.readFile(path.join(ASSET_DIR, imageName));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function imageNameForSlide(index) {
  const map = [
    'site-entry.png',
    'site-entry.png',
    'training-records.png',
    'ppe-items.png',
    'ppe-items.png',
    'ppe-check.png',
    'lift-tieoff.png',
    'harness-inspection.png',
    'ladder-last.png',
    'ladder-last.png',
    'electrical-gfci.png',
    'electrical-gfci.png',
    'material-handling.png',
    'material-handling.png',
    'fire-safety.png',
    'housekeeping.png',
    'hazcom-sds.png',
    'scaffold-inspection.png',
    'lift-tieoff.png',
    'heavy-equipment.png',
    'confined-space.png',
    'asbestos-lead-silica.png',
    'environmental-waste.png',
    'emergency-muster.png',
    'incident-reporting.png',
    'stop-work-authority.png',
    'drug-free-policy.png',
    'incident-reporting.png',
    'site-entry.png'
  ];
  return map[index] || 'site-entry.png';
}

function addShape(slide, geometry, position, fill, lineFill = 'none', lineWidth = 0) {
  return slide.shapes.add({
    geometry,
    position,
    fill,
    line: { style: 'solid', fill: lineFill, width: lineWidth }
  });
}

function addText(slide, value, position, style) {
  const box = addShape(slide, 'textbox', position, 'none');
  box.text = value;
  box.text.style = style;
  return box;
}

function addFooter(slide, index) {
  addShape(slide, 'rect', { left: 0, top: 684, width: 1280, height: 36 }, navy2);
  addText(slide, 'PAL Environmental Services', { left: 56, top: 693, width: 360, height: 18 }, { fontSize: 13, bold: true, color: '#FFFFFF' });
  addText(slide, `Employee Orientation  |  ${String(index + 1).padStart(2, '0')}`, { left: 1010, top: 693, width: 220, height: 18 }, { fontSize: 12, color: '#DDEAF5', alignment: 'right' });
}

async function addVisualPanel(slide, item, index, includeImages) {
  const accent = item.accent || green;
  addShape(slide, 'rect', { left: 720, top: 74, width: 472, height: 520 }, gray, line, 1);
  addShape(slide, 'rect', { left: 720, top: 74, width: 472, height: 12 }, accent);
  if (includeImages) {
    slide.images.add({
      blob: await readImageBlob(imageNameForSlide(index)),
      contentType: 'image/png',
      alt: item.visual,
      fit: 'cover',
      position: { left: 736, top: 102, width: 440, height: 266 }
    });
    addShape(slide, 'rect', { left: 736, top: 368, width: 440, height: 4 }, accent);
    addText(slide, 'SCENE VISUAL', { left: 756, top: 394, width: 180, height: 24 }, { fontSize: 13, bold: true, color: muted });
    addText(slide, item.visual, { left: 756, top: 424, width: 390, height: 58 }, { fontSize: 18, bold: true, color: text });
  } else {
    addText(slide, 'VIDEO VISUAL', { left: 756, top: 118, width: 180, height: 24 }, { fontSize: 14, bold: true, color: muted });
    addText(slide, item.visual, { left: 756, top: 162, width: 400, height: 110 }, { fontSize: 24, bold: true, color: text });
  }

  const chips = item.callouts || item.bullets.slice(0, 4);
  chips.slice(0, 5).forEach((chip, chipIndex) => {
    const y = (includeImages ? 502 : 318) + chipIndex * (includeImages ? 30 : 46);
    addShape(slide, 'rect', { left: 756, top: y, width: 18, height: 18 }, accent);
    addText(slide, chip.replace(/^\d+\.\s*/, ''), { left: 790, top: y - 3, width: 330, height: 28 }, { fontSize: includeImages ? 15 : 20, bold: true, color: navy2 });
  });

  addText(slide, `Scene ${index + 1}`, { left: 756, top: 548, width: 180, height: 24 }, { fontSize: 13, bold: true, color: muted });
}

async function addSlide(presentation, item, index, includeImages = false) {
  const slide = presentation.slides.add();
  slide.background.fill = '#FFFFFF';
  const accent = item.accent || green;

  addShape(slide, 'rect', { left: 0, top: 0, width: 1280, height: 28 }, navy2);
  addShape(slide, 'rect', { left: 0, top: 28, width: 18, height: 656 }, accent);
  addText(slide, item.eyebrow, { left: 56, top: 70, width: 470, height: 22 }, { fontSize: 14, bold: true, color: muted });
  addText(slide, item.title, { left: 56, top: 110, width: 580, height: 150 }, { fontSize: 42, bold: true, color: navy2 });
  if (item.subtitle) {
    addText(slide, item.subtitle, { left: 56, top: 270, width: 560, height: 50 }, { fontSize: 24, color: muted });
  }

  const bulletTop = item.subtitle ? 352 : 308;
  item.bullets.forEach((bullet, bulletIndex) => {
    const y = bulletTop + bulletIndex * 64;
    addShape(slide, 'rect', { left: 64, top: y + 6, width: 12, height: 12 }, accent);
    addText(slide, bullet, { left: 96, top: y - 2, width: 560, height: 48 }, { fontSize: 24, bold: bulletIndex === 0, color: text });
  });

  await addVisualPanel(slide, item, index, includeImages);
  addFooter(slide, index);
  slide.speakerNotes.textFrame.setText([
    `Narration: ${item.notes}`,
    `Suggested visual: ${item.visual}`
  ]);
  slide.speakerNotes.setVisible(true);
}

async function addVisualFirstSlide(presentation, item, index) {
  const slide = presentation.slides.add();
  slide.background.fill = navy2;
  const accent = item.accent || green;

  slide.images.add({
    blob: await readImageBlob(imageNameForSlide(index)),
    contentType: 'image/png',
    alt: item.visual,
    fit: 'cover',
    position: { left: 0, top: 0, width: 1280, height: 720 }
  });

  addShape(slide, 'rect', { left: 0, top: 0, width: 1280, height: 720 }, '#00000080');
  addShape(slide, 'rect', { left: 0, top: 0, width: 1280, height: 90 }, '#0B243DE6');
  addShape(slide, 'rect', { left: 0, top: 90, width: 1280, height: 8 }, accent);
  addShape(slide, 'rect', { left: 0, top: 618, width: 1280, height: 102 }, '#0B243DE6');

  addText(slide, item.eyebrow, { left: 56, top: 24, width: 420, height: 22 }, { fontSize: 13, bold: true, color: '#DDEAF5' });
  addText(slide, item.title, { left: 56, top: 540, width: 900, height: 58 }, { fontSize: 36, bold: true, color: '#FFFFFF' });

  const shortPoints = (item.callouts || item.bullets).slice(0, 3).map(point => point.replace(/^\d+\.\s*/, ''));
  shortPoints.forEach((point, pointIndex) => {
    const left = 56 + pointIndex * 375;
    addShape(slide, 'rect', { left, top: 628, width: 14, height: 14 }, accent);
    addText(slide, point, { left: left + 24, top: 622, width: 320, height: 36 }, { fontSize: 18, bold: true, color: '#FFFFFF' });
  });

  addText(slide, `PAL Environmental Services  |  Employee Orientation  |  ${String(index + 1).padStart(2, '0')}`, { left: 56, top: 690, width: 760, height: 18 }, { fontSize: 12, color: '#DDEAF5' });
  slide.speakerNotes.textFrame.setText([
    `Narration: ${item.notes}`,
    `Image-first scene: ${item.visual}`
  ]);
  slide.speakerNotes.setVisible(true);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });

  const presentation = Presentation.create({
    slideSize: { width: 1280, height: 720 }
  });

  const includeImages = process.argv.includes('--with-images');
  const visualFirst = process.argv.includes('--visual-first');
  for (const [index, item] of slides.entries()) {
    if (visualFirst) {
      await addVisualFirstSlide(presentation, item, index);
    } else {
      await addSlide(presentation, item, index, includeImages);
    }
  }

  const montage = await presentation.export({ format: 'webp', montage: true, scale: 1 });
  await writeBlob(path.join(QA_DIR, 'PAL_Orientation_Slide_Package_English_v1_montage.webp'), montage);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, '0')}`;
    await writeBlob(path.join(QA_DIR, `${stem}.png`), await presentation.export({ slide, format: 'png', scale: 1 }));
    await fs.writeFile(path.join(QA_DIR, `${stem}.layout.json`), await (await slide.export({ format: 'layout' })).text());
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  const outFile = visualFirst ? FINAL_VISUAL_PPTX : includeImages ? FINAL_IMAGE_PPTX : FINAL_PPTX;
  await pptx.save(outFile);
  console.log(outFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
