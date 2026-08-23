export const DEFAULT_SAFETY_DOCUMENT_TYPES = [
  'Daily Safety Meeting',
  'Toolbox Talk',
  'Equipment Checklist',
  'Orientation & Training',
  'Payroll Attendance'
];

export const DEFAULT_SAFETY_TOPICS = [
  'Proper Lifting',
  'Fall Protection',
  'Housekeeping',
  'Stretch & Flex',
  'Ladders Last',
  'PPE',
  'Respiratory Protection',
  'Scissor Lift',
  'Scaffold Safety',
  'Electrical Safety',
  'Lockout/Tagout',
  'Hazard Communication',
  'Hot Work',
  'Confined Space',
  'Emergency Procedures',
  'Incident Reporting'
];

const TOPIC_KEYWORDS = {
  'Proper Lifting': ['proper lifting', 'material handling', 'team lift', 'heavy lifting', 'lift with the legs', 'back injury', 'mechanical assistance'],
  'Fall Protection': ['fall protection', 'tie off', 'tie-off', 'anchor point', 'anchorage', 'leading edge', 'guardrail', 'retractable', 'lanyard'],
  'Housekeeping': ['housekeeping', 'trip hazard', 'walking path', 'debris', 'clean work area'],
  'Stretch & Flex': ['stretch and flex', 'stretch & flex', 'stretch before work', 'warm up'],
  'Ladders Last': ['ladders last', 'ladder last', 'ladder safety'],
  'PPE': ['personal protective equipment', 'ppe', 'hard hat', 'safety glasses', 'gloves', 'work boots'],
  'Respiratory Protection': ['respirator', 'respiratory protection', 'fit test', 'silica', 'airborne dust'],
  'Scissor Lift': ['scissor lift', 'aerial lift', 'boom lift', 'lift inspection'],
  'Scaffold Safety': ['scaffold', 'scaffolding'],
  'Electrical Safety': ['electrical', 'gfci', 'extension cord', 'power tool'],
  'Lockout/Tagout': ['lockout', 'tagout', 'loto', 'energy isolation'],
  'Hazard Communication': ['hazard communication', 'hazcom', 'sds', 'safety data sheet'],
  'Hot Work': ['hot work', 'fire watch', 'welding', 'cutting', 'torch'],
  'Confined Space': ['confined space', 'permit-required space'],
  'Emergency Procedures': ['emergency procedure', 'muster', 'evacuation', 'first aid'],
  'Incident Reporting': ['incident reporting', 'report injuries', 'report injury', 'near miss']
};

export function normalizeSafetyName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function safetyNamesMatch(candidate = '', requested = '') {
  const left = normalizeSafetyName(candidate);
  const right = normalizeSafetyName(requested);
  if (!left || !right) return false;
  if (left === right) return true;
  const requestedParts = right.split(' ').filter(Boolean);
  const candidateParts = left.split(' ').filter(Boolean);
  if (requestedParts.length < 2 || candidateParts.length < 2) return false;
  return requestedParts[0] === candidateParts[0]
    && requestedParts[requestedParts.length - 1] === candidateParts[candidateParts.length - 1];
}

function textValue(value) {
  if (Array.isArray(value)) return value.map(textValue).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(textValue).join(' ');
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function formSearchText(form = {}) {
  const data = form.documentData || {};
  const fields = [
    form.formTitle,
    form.formKey,
    data.topic,
    data.items_discussed,
    data.tasks_locations,
    data.hazard1,
    data.control1,
    data.hazard2,
    data.control2,
    data.inspection_hazards,
    data.work_description,
    data.foreman_hazard_focus,
    data.equipment,
    data.conditions,
    data.notes,
    data.description,
    data.checklistTitle,
    data.checklistType,
    textValue(data)
  ];
  return fields.map(textValue).join(' ').toLowerCase();
}

export function inferSafetyTopics(form = {}, customTopics = []) {
  const haystack = formSearchText(form);
  const topics = Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => haystack.includes(keyword)))
    .map(([topic]) => topic);
  (customTopics || []).forEach(topic => {
    const clean = String(topic || '').trim();
    if (clean && haystack.includes(clean.toLowerCase()) && !topics.includes(clean)) topics.push(clean);
  });
  return topics;
}

export function safetyDocumentType(form = {}, customTypes = []) {
  const key = String(form.formKey || '').toLowerCase();
  const title = String(form.formTitle || '').trim();
  const normalizedTitle = title.toLowerCase();
  if (key === 'daily-safety-meeting' || key === 'ai-daily-safety') return 'Daily Safety Meeting';
  if (key === 'weekly-toolbox-talk') return 'Toolbox Talk';
  if (key.includes('payroll')) return 'Payroll Attendance';
  if (key.includes('checklist') || normalizedTitle.includes('checklist') || normalizedTitle.includes('inspection')) return 'Equipment Checklist';
  const custom = (customTypes || []).find(type => normalizedTitle.includes(String(type || '').trim().toLowerCase()));
  return custom || title || 'Other Safety Document';
}

function matchingFormEntries(form = {}, employeeName = '') {
  const data = form.documentData || {};
  const entries = [];
  const push = (name, signature = '', source = 'record') => {
    if (safetyNamesMatch(name, employeeName) || safetyNamesMatch(signature, employeeName)) {
      entries.push({ name: name || signature, signature, source });
    }
  };
  (Array.isArray(data.signIns) ? data.signIns : []).forEach(row => push(row.printName, row.signature, 'signature'));
  (Array.isArray(data.crewSignatures) ? data.crewSignatures : []).forEach(row => push(row.printName, row.signature, 'signature'));
  (Array.isArray(data.rows) ? data.rows : []).forEach(row => push(row.printName || row.workerName, row.signature, row.workerName ? 'attendance' : 'signature'));
  return entries;
}

function recordDate(form = {}) {
  const data = form.documentData || {};
  return data.date || data.dateSigned || data.reportDate || data.inspection_date || data.sup_date || form.localSubmittedAt || form.submittedAt || '';
}

export function buildEmployeeSafetyRecords({ employeeName = '', forms = [], intakes = [], customTypes = [], customTopics = [] } = {}) {
  const records = [];
  (forms || []).forEach(form => {
    const matches = matchingFormEntries(form, employeeName);
    if (!matches.length) return;
    const type = safetyDocumentType(form, customTypes);
    records.push({
      id: `field:${form.projectId || ''}:${form.id || ''}`,
      source: 'fieldForm',
      sourceId: form.id || '',
      projectId: form.projectId || '',
      intakeId: '',
      title: form.formTitle || type,
      type,
      date: recordDate(form),
      projectName: form.projectName || '',
      jobNumber: form.jobNumber || '',
      topics: inferSafetyTopics(form, customTopics),
      status: matches.some(match => match.signature) ? 'Signed' : 'Documented',
      employeeName: matches[0]?.name || employeeName,
      submittedByName: form.submittedByName || '',
      details: formSearchText(form),
      form
    });
  });
  (intakes || []).forEach(intake => {
    if (!safetyNamesMatch(intake.name || intake.orientationForm?.employeeName, employeeName)) return;
    if (intake.orientationForm?.completed) {
      const form = intake.orientationForm;
      records.push({
        id: `intake:${intake.id}:orientation`,
        source: 'orientation',
        sourceId: 'orientation',
        projectId: intake.projectId || '',
        intakeId: intake.id || '',
        title: 'PAL Employee Safety Orientation',
        type: 'Orientation & Training',
        date: form.dateSigned || form.orientationCompletedAt || form.savedAt || '',
        projectName: intake.projectName || form.project || '',
        jobNumber: intake.projectJobNumber || '',
        topics: [...DEFAULT_SAFETY_TOPICS],
        status: form.signature ? 'Signed' : 'Completed',
        employeeName: form.employeeName || intake.name || employeeName,
        submittedByName: form.savedBy || '',
        details: `Orientation completed in ${form.orientationLanguage || 'English'} with score ${form.orientationScore ?? ''}`,
        intake
      });
    }
    if (intake.safetyAgreementForm?.completed) {
      const form = intake.safetyAgreementForm;
      records.push({
        id: `intake:${intake.id}:safety-agreement`,
        source: 'safetyAgreement',
        sourceId: 'safety-agreement',
        projectId: intake.projectId || '',
        intakeId: intake.id || '',
        title: 'Employee Safety Agreement',
        type: 'Orientation & Training',
        date: form.dateSigned || form.savedAt || '',
        projectName: intake.projectName || '',
        jobNumber: intake.projectJobNumber || '',
        topics: ['PPE', 'Incident Reporting', 'Emergency Procedures'],
        status: form.signature ? 'Signed' : 'Completed',
        employeeName: intake.name || employeeName,
        submittedByName: form.savedBy || '',
        details: textValue(form),
        intake
      });
    }
  });
  return records.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export function filterEmployeeSafetyRecords(records = [], { documentType = '', safetyTopic = '' } = {}) {
  return (records || []).filter(record => {
    if (documentType && documentType !== 'All documents' && record.type !== documentType) return false;
    if (safetyTopic && safetyTopic !== 'All safety topics' && !(record.topics || []).includes(safetyTopic)) return false;
    return true;
  });
}

export function safetyRecordSummary(records = [], attentionCount = 0) {
  const safetyRecords = records.filter(record => record.type !== 'Payroll Attendance');
  return {
    total: records.length,
    safety: safetyRecords.length,
    properLifting: safetyRecords.filter(record => (record.topics || []).includes('Proper Lifting')).length,
    attention: Number(attentionCount || 0)
  };
}
