/**
 * Girth's browser-local prototype domain. Every person, payment and project here
 * is sample data. Role checks demonstrate workflow rules; they are not server
 * authorization. There are no banking, payment or automatic billing calls.
 *
 * State is JSON-serializable: project totals, sponsor orders, one demo member,
 * tasks, payment records and an append-only activity history. Tasks progress
 * available -> assigned -> submitted -> verified -> paid. Membership charges
 * are independent from task earnings, and pausing affects renewal only.
 */

const DAY_MS = 86_400_000;
const MEMBERSHIP_DAYS = 30;
const MEMBERSHIP_PRICE_INR = 300;
const TREE_PRICE_INR = 600;

export const PROFILE_OPTIONS = {
  villages: ['Kandi', 'Sangareddy', 'Other'],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  transport: [{ value: 'walk', label: 'Walking', range: 5 }, { value: 'cycle', label: 'Bicycle', range: 15 }, { value: 'public', label: 'Public transport', range: 30 }, { value: 'two-wheeler', label: 'Two-wheeler', range: 30 }],
  interests: [{ value: 'tree-care', label: 'Tree care' }, { value: 'tree-planting', label: 'Tree planting' }, { value: 'nursery', label: 'Nursery work' }, { value: 'gardening', label: 'Gardening business' }],
};

export const COMMUNITY_OPPORTUNITIES = [
  { id: 'nursery-circle', title: 'Learn how a local nursery works', partner: 'Kandi Nursery Circle', kind: 'Skill session', location: 'Kandi', detail: 'A sample nursery visit covering sapling selection, stock handling and customer care. Register interest to keep it in your profile.', icon: 'leaf' },
  { id: 'garden-business', title: 'Start a small garden-care service', partner: 'Sangareddy Green Enterprise Group', kind: 'Business circle', location: 'Sangareddy', detail: 'A sample peer session on finding customers, pricing visits and preparing a simple service quotation.', icon: 'briefcase' },
  { id: 'care-peer', title: 'Meet other tree-care members', partner: 'Girth Community Circle', kind: 'Peer network', location: 'Kandi', detail: 'A sample community session to exchange practical care tips and discuss future team assignments.', icon: 'users' },
];

function createWeeklyCareTasks() {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `Weekly tree-care visit ${index + 1}`,
    type: 'care', status: 'available', trees: 25, durationHours: 2, payINR: 300,
    location: 'Kandi community grove · Zone A', village: 'Kandi', workDay: 'Saturday',
    interest: 'tree-care', planId: 'four-care-visits', visitNumber: index + 1,
    requiredCourseId: 'tree-care',
    instructions: 'One scheduled weekly visit: check all 25 trees, follow the site watering plan, clear small weeds, inspect irrigation and submit the care report. Allow 2 hours. ₹300 is paid only after this visit is completed and approved. All rates and scope are demo assumptions.',
    assigneeId: null, submission: null,
  }));
}

export const COURSES = [{
  id: 'tree-care',
  title: 'Tree-care foundations',
  description: 'Learn to plant carefully, check tree condition and record useful evidence.',
  duration: '12 min',
  lessons: [
    {
      id: 'planting-basics',
      title: 'Give a sapling a good start',
      body: 'Follow the site lead’s species and spacing plan. Handle the root ball gently, keep the root collar at the correct soil level and firm the surrounding soil without crushing it. Check that irrigation and protection are ready. Ask the site lead if the soil, planting hole or sapling looks unsuitable.',
    },
    {
      id: 'watering-and-care',
      title: 'Water according to conditions',
      body: 'Check soil moisture and follow the site’s care schedule before watering. Rain, soil and tree size change water needs. Water slowly around the root zone, check for blocked or leaking irrigation, and keep mulch away from the trunk. Report pests or damage instead of using an unapproved treatment.',
    },
    {
      id: 'recording-evidence',
      title: 'Make your work easy to verify',
      body: 'Record which trees you checked, their condition and the work you completed. Use the agreed measurement method consistently, attach dated evidence when available and describe problems honestly. Flag dead or damaged trees to the project lead. A photo supports a report; it does not replace the care itself.',
    },
  ],
  questions: [
    {
      id: 'watering-check',
      prompt: 'What should guide a watering visit?',
      options: [
        { value: 'moisture', label: 'Soil moisture, weather and the site’s care plan' },
        { value: 'same-amount', label: 'Exactly the same amount every day, whatever the conditions' },
        { value: 'photo-only', label: 'Whether a new photograph is needed' },
      ],
      correctValue: 'moisture',
    },
    {
      id: 'damage-report',
      prompt: 'You find a damaged sapling. What should you do?',
      options: [
        { value: 'hide', label: 'Leave it out of the report' },
        { value: 'report', label: 'Record the condition and tell the project lead' },
        { value: 'healthy', label: 'Mark it healthy so the task can be paid' },
      ],
      correctValue: 'report',
    },
  ],
}];

const ACTION_ROLES = {
  SAVE_MEMBER_PROFILE: 'member',
  RECORD_COMMUNITY_INTEREST: 'member',
  FUND_PROJECT: 'sponsor',
  ACTIVATE_MEMBERSHIP: 'member',
  PAUSE_MEMBERSHIP: 'member',
  RESUME_MEMBERSHIP: 'member',
  COMPLETE_LESSON: 'member',
  COMPLETE_TRAINING: 'member',
  CLAIM_TASK: 'member',
  SUBMIT_TASK: 'member',
  APPROVE_TASK: 'operations',
  PAY_TASK: 'operations',
};

function fail(message) {
  throw new Error(message);
}

function timestamp(now) {
  if (typeof now !== 'number' || !Number.isFinite(now)) fail('The demo time must be a valid timestamp.');
  return new Date(now).toISOString();
}

function requireInteger(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`${label} must be a whole number from ${min} to ${max}.`);
  }
}

function getTask(state, taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) fail('This task could not be found. Refresh the task list.');
  return task;
}

function record(state, at, type, title, detail) {
  state.activity.unshift({ id: `activity-${state.revision}`, title, detail, at, type });
}

export function createInitialState(now = Date.now()) {
  const at = timestamp(now);
  return {
    version: 1,
    revision: 0,
    project: {
      id: 'kandi',
      name: 'Kandi community grove',
      location: 'Kandi, Sangareddy',
      fundedTrees: 500,
      planted: 500,
      healthy: 482,
      attention: 8,
      replacements: 10,
      committedINR: 300000,
      careUntil: '2029-11-23',
    },
    member: {
      id: 'member-1',
      name: 'Ananya Reddy',
      location: 'Kandi',
      profile: { saved: false, village: 'Kandi', availabilityDay: 'Saturday', transport: 'walk', travelRadiusKm: 5, interests: ['tree-care', 'tree-planting'], updatedAt: null },
      communityInterests: [],
      membership: { paidUntil: null, autoRenew: false, charges: [] },
      completedLessons: [],
      certificates: [],
    },
    orders: [],
    tasks: createWeeklyCareTasks(),
    payments: [
      { id: 'sample-payment-1', taskId: 'sample-care-1', memberId: 'sample-worker-1', amountINR: 4200, at: timestamp(now - 24 * DAY_MS) },
      { id: 'sample-payment-2', taskId: 'sample-care-2', memberId: 'sample-worker-2', amountINR: 4200, at: timestamp(now - 14 * DAY_MS) },
      { id: 'sample-payment-3', taskId: 'sample-care-3', memberId: 'sample-worker-3', amountINR: 4200, at: timestamp(now - 4 * DAY_MS) },
    ],
    activity: [
      { id: 'sample-activity-1', title: 'Care review recorded', detail: 'Sample review: 482 healthy trees, 8 needing attention and 10 awaiting replacement.', at, type: 'review' },
      { id: 'sample-activity-2', title: 'Local care work paid', detail: 'Sample payments total ₹12,600 across three local workers.', at: timestamp(now - 4 * DAY_MS), type: 'payment' },
      { id: 'sample-activity-3', title: 'Community grove planted', detail: '500 sample trees are shown in the proposed Kandi site. This is not a confirmed planting project.', at: timestamp(now - 30 * DAY_MS), type: 'planting' },
    ],
  };
}

export function isMembershipActive(state, now = Date.now()) {
  const paidUntil = Date.parse(state.member.membership.paidUntil ?? '');
  return Number.isFinite(paidUntil) && paidUntil > now;
}

export function getTaskMatch(state, task) {
  const profile = state.member.profile;
  const reasons = [];
  const distanceKm = profile.village === 'Other' || task.village === 'Other' ? null : profile.village === task.village ? 3 : 12;
  if (!profile.saved) reasons.push('Save your profile to find suitable work.');
  if (distanceKm === null) reasons.push('No nearby site is configured for your location in this demo.');
  const transportRange = PROFILE_OPTIONS.transport.find(item => item.value === profile.transport)?.range ?? 0;
  if (distanceKm !== null && distanceKm > Math.min(profile.travelRadiusKm, transportRange)) reasons.push('This site is outside your selected travel range or transport reach.');
  if (profile.availabilityDay !== task.workDay) reasons.push(`This assignment is scheduled for ${task.workDay}.`);
  if (!profile.interests.includes(task.interest)) reasons.push('This type of work is outside your selected interests.');
  const profileMatch = reasons.length === 0;
  const trained = state.member.certificates.some(certificate => certificate.courseId === task.requiredCourseId);
  if (!trained) reasons.push('Complete the tree-care training and assessment.');
  const previousVisitComplete = !task.visitNumber || task.visitNumber === 1 || state.tasks.some(item => item.planId === task.planId && item.visitNumber === task.visitNumber - 1 && item.status === 'paid');
  if (!previousVisitComplete) reasons.push(`Finish the review and payment for visit ${task.visitNumber - 1} first.`);
  return { matches: profileMatch && trained && previousVisitComplete, profileMatch, trained, previousVisitComplete, distanceKm, reasons };
}

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value, max = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const isCount = (value, min = 0, max = 1_000_000_000) => Number.isSafeInteger(value) && value >= min && value <= max;
const isAmount = value => isCount(value, 0, Number.MAX_SAFE_INTEGER);
const isFiniteRange = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const isIsoDateTime = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};
const isCalendarDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isIsoDateTime(`${value}T00:00:00.000Z`);
const isList = (value, predicate) => Array.isArray(value) && value.length <= 10000 && Array.from(value).every(predicate);
const uniqueIds = value => new Set(value.map(item => item.id)).size === value.length;

/**
 * Validate saved JSON before rendering it. This is recovery for stale or
 * malformed browser storage, not authentication or trusted payment validation.
 * Unknown extra properties are harmless; all fields consumed by the UI and
 * model must have the expected type, range and state-dependent presence.
 */
export function isValidState(value) {
  try {
    if (!isRecord(value) || value.version !== 1 || !isCount(value.revision)) return false;
    const project = value.project;
    if (!isRecord(project) || !isText(project.id, 128) || !isText(project.name, 200) || !isText(project.location, 200)) return false;
    if (!['fundedTrees', 'planted', 'healthy', 'attention', 'replacements'].every(key => isCount(project[key]))) return false;
    if (!isAmount(project.committedINR) || !isCalendarDate(project.careUntil)) return false;
    if (project.planted > project.fundedTrees || project.healthy + project.attention + project.replacements !== project.planted) return false;

    const member = value.member;
    if (!isRecord(member) || !isText(member.id, 128) || !isText(member.name, 80) || member.name.trim().length < 2 || !isText(member.location, 200)) return false;
    const profile = member.profile;
    if (!isRecord(profile) || typeof profile.saved !== 'boolean' || !PROFILE_OPTIONS.villages.includes(profile.village) || !PROFILE_OPTIONS.days.includes(profile.availabilityDay)) return false;
    if (!PROFILE_OPTIONS.transport.some(item => item.value === profile.transport) || !isCount(profile.travelRadiusKm, 1, 30)) return false;
    if (!isList(profile.interests, interest => PROFILE_OPTIONS.interests.some(item => item.value === interest)) || profile.interests.length === 0 || new Set(profile.interests).size !== profile.interests.length) return false;
    if (profile.saved ? !isIsoDateTime(profile.updatedAt) : profile.updatedAt !== null) return false;
    if (!isList(member.communityInterests, item => isRecord(item) && COMMUNITY_OPPORTUNITIES.some(opportunity => opportunity.id === item.opportunityId) && isIsoDateTime(item.at))) return false;
    if (new Set(member.communityInterests.map(item => item.opportunityId)).size !== member.communityInterests.length) return false;
    const membership = member.membership;
    if (!isRecord(membership) || typeof membership.autoRenew !== 'boolean') return false;
    if (membership.paidUntil !== null && !isIsoDateTime(membership.paidUntil)) return false;
    if (!isList(membership.charges, charge => isRecord(charge) && isText(charge.id, 128) && isAmount(charge.amountINR) && charge.amountINR > 0 && isCount(charge.days, 1, 366) && isIsoDateTime(charge.at)) || !uniqueIds(membership.charges)) return false;
    if (!isList(member.completedLessons, lessonId => isText(lessonId, 128)) || new Set(member.completedLessons).size !== member.completedLessons.length) return false;
    if (!isList(member.certificates, certificate => isRecord(certificate) && isText(certificate.id, 128) && isText(certificate.courseId, 128) && isText(certificate.title, 200) && isIsoDateTime(certificate.issuedAt)) || !uniqueIds(member.certificates)) return false;
    if (new Set(member.certificates.map(certificate => certificate.courseId)).size !== member.certificates.length) return false;

    if (!isList(value.orders, order => isRecord(order) && isText(order.id, 128) && isText(order.name, 80) && isCount(order.count, 1, 500) && isAmount(order.totalINR) && order.totalINR === order.count * TREE_PRICE_INR && ['company', 'gift'].includes(order.kind) && isIsoDateTime(order.at)) || !uniqueIds(value.orders)) return false;
    if (!isList(value.tasks, task => {
      if (!isRecord(task) || !isText(task.id, 128) || !isText(task.title, 200) || !['care', 'planting'].includes(task.type)) return false;
      if (!['available', 'assigned', 'submitted', 'verified', 'paid'].includes(task.status)) return false;
      if (!isCount(task.trees, 1, 500) || !isFiniteRange(task.durationHours, 0.01, 1000) || !isAmount(task.payINR) || task.payINR <= 0) return false;
      if (!isText(task.location, 200) || !isText(task.instructions, 2000) || !isText(task.requiredCourseId, 128)) return false;
      if (!PROFILE_OPTIONS.villages.includes(task.village) || !PROFILE_OPTIONS.days.includes(task.workDay) || !PROFILE_OPTIONS.interests.some(item => item.value === task.interest)) return false;
      if (task.planId !== undefined && (!isText(task.planId, 128) || !isCount(task.visitNumber, 1, 4))) return false;
      if (task.visitNumber !== undefined && !isText(task.planId, 128)) return false;
      if (task.orderId !== undefined && !isText(task.orderId, 128)) return false;
      if (task.status === 'available' ? task.assigneeId !== null : !isText(task.assigneeId, 128)) return false;
      if (['assignedAt', 'verifiedAt', 'paidAt'].some(key => task[key] !== undefined && !isIsoDateTime(task[key]))) return false;
      if (['available', 'assigned'].includes(task.status)) return task.submission === null;
      const report = task.submission;
      return isRecord(report) && isText(report.note, 500) && report.note.trim().length >= 10
        && isCount(report.checkedTrees, 1, task.trees) && report.checkedTrees === task.trees
        && isCount(report.healthyTrees, 0, report.checkedTrees)
        && isFiniteRange(report.heightCm, 5, 1000) && isIsoDateTime(report.at) && isText(report.evidence, 200);
    }) || !uniqueIds(value.tasks)) return false;
    if (!isList(value.payments, payment => isRecord(payment) && isText(payment.id, 128) && isText(payment.taskId, 128) && isText(payment.memberId, 128) && isAmount(payment.amountINR) && payment.amountINR > 0 && isIsoDateTime(payment.at)) || !uniqueIds(value.payments)) return false;
    if (new Set(value.payments.map(payment => payment.taskId)).size !== value.payments.length) return false;
    if (!isList(value.activity, event => isRecord(event) && isText(event.id, 128) && isText(event.title, 200) && isText(event.detail, 2000) && isText(event.type, 80) && isIsoDateTime(event.at)) || !uniqueIds(value.activity)) return false;
    return true;
  } catch {
    return false;
  }
}

export function transition(state, action, now = Date.now()) {
  const requiredRole = ACTION_ROLES[action?.type];
  if (!requiredRole) fail('This demo action is not recognised.');
  if (action.actor !== requiredRole) fail(`Switch to the ${requiredRole} role to perform this action.`);
  if (!isValidState(state)) fail('The saved demo is incompatible or damaged. Reset the demo to continue.');

  const at = timestamp(now);
  const next = structuredClone(state);
  next.revision += 1;

  switch (action.type) {
    case 'SAVE_MEMBER_PROFILE': {
      const name = typeof action.name === 'string' ? action.name.trim() : '';
      if (name.length < 2 || name.length > 80) fail('Enter your name using 2 to 80 characters.');
      if (!PROFILE_OPTIONS.villages.includes(action.village)) fail('Choose Kandi, Sangareddy or Other as your location.');
      if (!PROFILE_OPTIONS.days.includes(action.availabilityDay)) fail('Choose the day you are available for weekly care.');
      if (!PROFILE_OPTIONS.transport.some(item => item.value === action.transport)) fail('Choose a valid way to travel.');
      requireInteger(action.travelRadiusKm, 1, 30, 'Travel radius');
      if (!Array.isArray(action.interests) || action.interests.length === 0 || action.interests.length > PROFILE_OPTIONS.interests.length || !action.interests.every(interest => PROFILE_OPTIONS.interests.some(item => item.value === interest)) || new Set(action.interests).size !== action.interests.length) fail('Choose at least one valid work interest.');
      next.member.name = name;
      next.member.location = action.village;
      next.member.profile = { saved: true, village: action.village, availabilityDay: action.availabilityDay, transport: action.transport, travelRadiusKm: action.travelRadiusKm, interests: [...action.interests], updatedAt: at };
      record(next, at, 'profile', 'Member profile saved', `Work preferences saved for ${action.village}, with weekly availability on ${action.availabilityDay}. Matching is illustrative and does not guarantee an assignment.`);
      break;
    }

    case 'RECORD_COMMUNITY_INTEREST': {
      const opportunity = COMMUNITY_OPPORTUNITIES.find(item => item.id === action.opportunityId);
      if (!opportunity) fail('Choose an available community opportunity.');
      if (!state.member.profile.saved) fail('Save your profile before recording community interest.');
      if (state.member.communityInterests.some(item => item.opportunityId === opportunity.id)) return state;
      next.member.communityInterests.push({ opportunityId: opportunity.id, at });
      record(next, at, 'community', 'Community interest saved', `Interest in “${opportunity.title}” was saved locally. The organisation and opening are fictional; no message or application was sent.`);
      break;
    }

    case 'FUND_PROJECT': {
      requireInteger(action.count, 1, 500, 'Tree quantity');
      const name = typeof action.name === 'string' ? action.name.trim() : '';
      if (name.length < 2 || name.length > 80) fail('Enter a buyer or gift name between 2 and 80 characters.');
      if (!['company', 'gift'].includes(action.kind)) fail('Choose company or gift sponsorship.');
      const order = {
        id: `order-${next.revision}`,
        count: action.count,
        totalINR: action.count * TREE_PRICE_INR,
        name,
        kind: action.kind,
        at,
      };
      next.orders.unshift(order);
      next.project.fundedTrees += action.count;
      next.project.committedINR += order.totalINR;
      next.tasks.unshift({
        id: `task-${order.id}`,
        orderId: order.id,
        title: `Plant ${action.count} sponsored trees`,
        type: 'planting',
        status: 'available',
        trees: action.count,
        durationHours: action.count / 25,
        payINR: action.count * 6,
        location: 'Kandi community grove · New planting',
        village: 'Kandi', workDay: 'Saturday', interest: 'tree-planting',
        requiredCourseId: 'tree-care',
        instructions: `Follow the approved site plan and plant all ${action.count} allocated saplings. Check irrigation and protection, then record tree condition and the completed planting. The duration and pay are illustrative demo assumptions.`,
        assigneeId: null,
        submission: null,
      });
      record(next, at, 'funding', `${action.count} more trees funded`, `${name} reserved ${action.count} tree allocations for a simulated ₹${order.totalINR.toLocaleString('en-IN')} payment. Planting is pending.`);
      break;
    }

    case 'ACTIVATE_MEMBERSHIP': {
      if (action.acceptedTerms !== true) fail('Accept the membership terms before activating the demo pass.');
      if (isMembershipActive(state, now)) fail('Your membership is already active. No additional charge was made.');
      next.member.membership.paidUntil = timestamp(now + MEMBERSHIP_DAYS * DAY_MS);
      next.member.membership.autoRenew = true;
      next.member.membership.charges.push({
        id: `membership-${next.revision}`,
        amountINR: MEMBERSHIP_PRICE_INR,
        days: MEMBERSHIP_DAYS,
        at,
      });
      record(next, at, 'membership', 'Green Network membership activated', 'A simulated ₹300 pass covers 30 subscribed days. No real payment or automatic billing takes place.');
      break;
    }

    case 'PAUSE_MEMBERSHIP':
    case 'RESUME_MEMBERSHIP': {
      if (!isMembershipActive(state, now)) fail('Your pass is inactive or expired. Activate a new pass to continue.');
      const resume = action.type === 'RESUME_MEMBERSHIP';
      if (state.member.membership.autoRenew === resume) return state;
      next.member.membership.autoRenew = resume;
      record(next, at, 'membership', resume ? 'Membership renewal resumed' : 'Membership renewal paused', 'Current paid access and earned wages remain available. This changes a demo preference only.');
      break;
    }

    case 'COMPLETE_LESSON': {
      const lesson = COURSES.flatMap(course => course.lessons).find(item => item.id === action.lessonId);
      if (!lesson) fail('This lesson could not be found.');
      if (state.member.completedLessons.includes(lesson.id)) return state;
      next.member.completedLessons.push(lesson.id);
      record(next, at, 'learning', 'Training lesson completed', lesson.title);
      break;
    }

    case 'COMPLETE_TRAINING': {
      const course = COURSES.find(item => item.id === action.courseId);
      if (!course) fail('This course could not be found.');
      if (state.member.certificates.some(item => item.courseId === course.id)) return state;
      if (!course.lessons.every(lesson => state.member.completedLessons.includes(lesson.id))) {
        fail('Complete all three lessons before taking the assessment.');
      }
      const correct = course.questions.every(question => action.answers?.[question.id] === question.correctValue);
      if (!correct) fail('Answer both questions correctly to earn the certificate. Review the lessons and try again.');
      next.member.certificates.push({
        id: `GIRTH-DEMO-${String(next.revision).padStart(4, '0')}`,
        courseId: course.id,
        title: course.title,
        issuedAt: at,
      });
      record(next, at, 'learning', 'Tree-care certificate earned', 'Girth-issued demo completion certificate. This is not an accredited qualification.');
      break;
    }

    case 'CLAIM_TASK': {
      const task = getTask(next, action.taskId);
      if (task.status !== 'available') fail('This task is no longer available. Choose another opportunity.');
      if (!isMembershipActive(state, now)) fail('Activate a Green Network membership before accepting a new task.');
      if (!state.member.certificates.some(certificate => certificate.courseId === task.requiredCourseId)) {
        fail('Complete the tree-care training and assessment before accepting this task.');
      }
      const match = getTaskMatch(state, task);
      if (!match.matches) fail(match.reasons[0]);
      task.status = 'assigned';
      task.assigneeId = state.member.id;
      task.assignedAt = at;
      record(next, at, 'assignment', 'A local care assignment accepted', `${state.member.name} accepted “${task.title}” for a simulated ₹${task.payINR.toLocaleString('en-IN')} payment after review.`);
      break;
    }

    case 'SUBMIT_TASK': {
      const task = getTask(next, action.taskId);
      if (task.status !== 'assigned' || task.assigneeId !== state.member.id) {
        fail('Only your currently assigned task can be submitted.');
      }
      const note = typeof action.note === 'string' ? action.note.trim() : '';
      if (note.length < 10 || note.length > 500) fail('Describe the completed work in 10 to 500 characters.');
      requireInteger(action.checkedTrees, 1, task.trees, 'Trees checked');
      requireInteger(action.healthyTrees, 0, action.checkedTrees, 'Healthy trees');
      if (typeof action.heightCm !== 'number' || !Number.isFinite(action.heightCm) || action.heightCm < 5 || action.heightCm > 1000) {
        fail('Enter a measured height between 5 and 1,000 cm.');
      }
      if (action.checkedTrees !== task.trees) {
        fail(`Complete and check the whole ${task.type} task (${task.trees} trees) before submitting it for the full task payment.`);
      }
      task.submission = {
        note,
        checkedTrees: action.checkedTrees,
        healthyTrees: action.healthyTrees,
        heightCm: action.heightCm,
        at,
        evidence: 'Illustrative demo photo',
      };
      task.status = 'submitted';
      record(next, at, 'submission', 'Field work submitted for review', `${task.title}: ${action.checkedTrees} trees checked. Sponsor totals change only after operations review.`);
      break;
    }

    case 'APPROVE_TASK': {
      const task = getTask(next, action.taskId);
      if (task.status !== 'submitted' || !task.submission) fail('Only submitted work can be approved.');
      if (task.submission.checkedTrees !== task.trees) fail('The whole task must be complete before approval.');
      if (task.type === 'planting') {
        if (next.project.planted + task.submission.checkedTrees > next.project.fundedTrees) {
          fail('This planting would exceed the number of funded trees. Check the allocation first.');
        }
        next.project.planted += task.submission.checkedTrees;
        next.project.healthy += task.submission.healthyTrees;
        next.project.attention += task.submission.checkedTrees - task.submission.healthyTrees;
      }
      task.status = 'verified';
      task.verifiedAt = at;
      record(next, at, 'review', 'Field work verified', `${task.title} approved. ₹${task.payINR.toLocaleString('en-IN')} is ready for a simulated worker payment.`);
      break;
    }

    case 'PAY_TASK': {
      const task = getTask(next, action.taskId);
      if (task.status !== 'verified') fail('Only verified, unpaid work can be paid.');
      if (!task.assigneeId || next.payments.some(payment => payment.taskId === task.id)) {
        fail('A verified assignment is required and each task can be paid only once.');
      }
      next.payments.push({
        id: `payment-${next.revision}`,
        taskId: task.id,
        memberId: task.assigneeId,
        amountINR: task.payINR,
        at,
      });
      task.status = 'paid';
      task.paidAt = at;
      record(next, at, 'payment', 'Worker payment recorded', `Simulated ₹${task.payINR.toLocaleString('en-IN')} payment for “${task.title}”. No money was transferred.`);
      break;
    }
  }
  return next;
}

export function getMetrics(state) {
  const aliveTrees = state.project.healthy + state.project.attention;
  const memberPayments = state.payments.filter(payment => payment.memberId === state.member.id);
  const memberEarnedINR = memberPayments.reduce((sum, payment) => sum + payment.amountINR, 0);
  const membershipFeesINR = state.member.membership.charges.reduce((sum, charge) => sum + charge.amountINR, 0);
  return {
    fundedTrees: state.project.fundedTrees,
    planted: state.project.planted,
    aliveTrees,
    survivalPct: state.project.planted ? Math.round(aliveTrees / state.project.planted * 1000) / 10 : 0,
    workerPaymentsINR: state.payments.reduce((sum, payment) => sum + payment.amountINR, 0),
    workersPaid: new Set(state.payments.map(payment => payment.memberId)).size,
    memberEarnedINR,
    memberPendingINR: state.tasks.filter(task => task.status === 'verified' && task.assigneeId === state.member.id).reduce((sum, task) => sum + task.payINR, 0),
    membershipFeesINR,
    memberNetINR: memberEarnedINR - membershipFeesINR,
    availableTasks: state.tasks.filter(task => task.status === 'available').length,
    reviewCount: state.tasks.filter(task => task.status === 'submitted').length,
  };
}
