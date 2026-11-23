import { esc, money, icon, badge } from './ui.js';
import { COURSES, getMetrics, isMembershipActive, getTaskMatch, PROFILE_OPTIONS, COMMUNITY_OPPORTUNITIES } from './model.js';

let opportunityFilter = 'all';

const fmtDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not started';
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const courseFor = (id) => COURSES.find((course) => course.id === id);
const certified = (state, id = 'tree-care') => state.member.certificates.some((certificate) => certificate.courseId === id);
const button = (label, action, options = '') => `<button class="button button-primary" data-action="${action}" ${options}>${label}</button>`;

function taskDuration(hours) {
  if (hours < 1) {
    const minutes = Math.max(1, Math.ceil(hours * 60));
    return `${minutes} estimated minute${minutes === 1 ? '' : 's'}`;
  }
  return `${Number(hours).toLocaleString('en-IN', { maximumFractionDigits: 1 })} estimated hour${hours === 1 ? '' : 's'}`;
}

function heading(eyebrow, title, description) {
  return `<header class="page-heading"><p class="eyebrow">${eyebrow}</p><h1 class="page-title">${title}</h1><p class="page-description">${description}</p></header>`;
}

function stat(label, value, detail, symbol) {
  return `<div class="card member-stat"><span class="member-stat-icon">${icon(symbol)}</span><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="muted small">${detail}</span></div>`;
}

function renderOpportunities(state) {
  const metrics = getMetrics(state);
  const active = isMembershipActive(state);
  const trained = certified(state);
  const profile = state.member.profile;
  const matchingCount = state.tasks.filter(task => task.status === 'available' && getTaskMatch(state, task).matches).length;
  const tasks = state.tasks.filter((task) => opportunityFilter === 'mine' ? task.assigneeId === state.member.id : task.status === 'available' || task.assigneeId === state.member.id);
  return `<div class="member-page">
    ${heading('GREEN NETWORK', 'Good work. Greener futures.', `Welcome, ${esc(state.member.name.split(' ')[0])}. Save your details, learn the skills and find a weekly care visit that fits.`)}
    <section class="member-welcome" aria-label="Your green network membership">
      <div><span class="member-overline">ONE VISIT. CARE THAT CONTINUES.</span><h2>Care for trees.<br>Earn ₹300 a visit.</h2><p>One weekly visit to check and care for 25 trees. Allow 2 hours, then submit your report for review.</p><div class="row member-welcome-meta">${icon('pin')} <span>Kandi community grove · illustrative opportunity</span></div></div>
      <div class="member-welcome-pass"><span class="member-pass-icon">${icon('leaf')}</span><span>Girth Green Network</span><strong>₹10<span> / subscribed day</span></strong><p>${active ? `Your pass is active until ${fmtDate(state.member.membership.paidUntil)}.` : 'A 30-day demo pass, with learning and work opportunities.'}</p><button class="button button-light" data-action="member-go-membership">${active ? 'Manage membership' : 'Explore membership'}</button></div>
    </section>
    <div class="grid-three member-stats">
      ${stat('Ready matches', matchingCount, 'Based on your profile and training', 'briefcase')}
      ${stat('Paid work earnings', money(metrics.memberEarnedINR), 'Membership shown separately', 'wallet')}
      ${stat('Skills completed', state.member.certificates.length, 'Certificates earned by assessment', 'book')}
    </div>
    <section class="member-weekly-plan card"><div><p class="eyebrow">FOUR-VISIT TRIAL</p><h2>Four completed visits. ₹1,200 in work pay.</h2><p>Each visit is reviewed and paid separately. With a ₹300 / 30-day membership, four paid visits leave ₹900 before expenses and tax. This is a four-visit trial, not guaranteed monthly income. Longer-term work frequency and funding are still to be agreed.</p></div><div class="member-visit-track">${state.tasks.filter(task => task.planId === 'four-care-visits').map(task => `<div class="${task.status === 'paid' ? 'is-paid' : ''}"><span>${task.status === 'paid' ? icon('check') : task.visitNumber}</span><strong>Visit ${task.visitNumber}</strong><small>${task.status === 'paid' ? '₹300 paid' : '₹300 after approval'}</small></div>`).join('')}</div></section>
    ${!profile.saved || !active || !trained ? `<section class="member-start card"><div><h2 class="card-title">Get ready for your first assignment</h2><p class="muted small">Creating a profile and taking the training are free. Choose a paid pass only when you are ready to accept suitable work.</p></div><div class="member-steps member-three-steps"><button class="member-step ${profile.saved ? 'is-done' : ''}" data-action="member-go-profile"><span>${profile.saved ? icon('check') : '1'}</span><div><strong>Tell us about you</strong><small>Location, availability and interests</small></div></button><button class="member-step ${trained ? 'is-done' : ''}" data-action="member-go-learning"><span>${trained ? icon('check') : '2'}</span><div><strong>Learn the essentials</strong><small>Visual lessons and an assessment</small></div></button><button class="member-step ${active ? 'is-done' : ''}" data-action="member-go-membership"><span>${active ? icon('check') : '3'}</span><div><strong>Choose your pass</strong><small>₹300 for 30 subscribed days</small></div></button></div></section>` : ''}
    ${profile.saved ? `<div class="member-match-strip"><span>${icon('pin')} ${esc(profile.village)} · ${esc(profile.availabilityDay)} · up to ${profile.travelRadiusKm} km</span><button class="button button-quiet" data-action="member-go-profile">Edit work preferences</button></div>` : ''}
    <div class="section-heading member-opportunity-heading"><div><p class="eyebrow">OPPORTUNITIES NEAR YOU</p><h2>Put your skills to work</h2></div><div class="member-filters" role="group" aria-label="Filter opportunities"><button class="${opportunityFilter === 'all' ? 'is-active' : ''}" data-action="member-filter" data-filter="all" aria-pressed="${opportunityFilter === 'all'}">All opportunities</button><button class="${opportunityFilter === 'mine' ? 'is-active' : ''}" data-action="member-filter" data-filter="mine" aria-pressed="${opportunityFilter === 'mine'}">My assignments</button></div></div>
    <div class="member-task-grid">${tasks.length ? tasks.map((task) => renderTask(state, task)).join('') : `<div class="card empty-state member-span-all">${icon('briefcase')}<h3>No assignments yet</h3><p>Accept an available opportunity when your membership and training are ready.</p><button class="button button-secondary" data-action="member-filter" data-filter="all">Browse opportunities</button></div>`}</div>
    <p class="member-footnote">Work depends on local customer demand, skills and availability. Membership does not guarantee employment or income.</p>
  </div>`;
}

function renderTask(state, task) {
  const active = isMembershipActive(state);
  const trained = certified(state, task.requiredCourseId);
  const match = getTaskMatch(state, task);
  const tones = { available: 'green', assigned: 'orange', submitted: 'orange', verified: 'green', paid: 'green' };
  const labels = { available: 'Open opportunity', assigned: 'Your assignment', submitted: 'Awaiting review', verified: 'Approved · payment pending', paid: 'Payment recorded' };
  let action;
  if (task.status === 'available') {
    action = !state.member.profile.saved || !match.profileMatch ? `<button class="button button-secondary" data-action="member-go-profile">${state.member.profile.saved ? 'Review preferences' : 'Complete your profile'}</button>` : !trained ? `<button class="button button-secondary" data-action="member-go-learning">Complete training</button>` : !match.previousVisitComplete ? '<button class="button button-secondary" disabled>Complete earlier visit</button>' : !active ? `<button class="button button-secondary" data-action="member-go-membership">Choose membership</button>` : button('Accept assignment', 'member-claim', `data-task-id="${esc(task.id)}"`);
  } else if (task.status === 'assigned') action = button('Submit care report', 'member-report', `data-task-id="${esc(task.id)}"`);
  else action = `<button class="button button-secondary" data-action="member-view-report" data-task-id="${esc(task.id)}">View submitted report</button>`;
  return `<article class="card member-task"><div class="member-task-top"><span class="member-task-icon ${task.type === 'planting' ? 'planting' : ''}">${icon(task.type === 'planting' ? 'tree' : 'leaf')}</span>${badge(labels[task.status] || titleCase(task.status), tones[task.status] || 'gray')}</div><h3>${esc(task.title)}</h3><p class="muted member-task-instructions">${esc(task.instructions)}</p><div class="member-task-details"><span>${icon('pin')}${esc(task.location)}</span><span>${icon('calendar')}${esc(task.workDay)}${task.visitNumber ? ` · visit ${task.visitNumber} of 4` : ''}</span><span>${icon('clock')}${taskDuration(task.durationHours)}</span><span>${icon('tree')}${task.trees} trees</span></div>${task.status === 'available' ? `<p class="member-match-reason ${match.matches ? 'is-match' : ''}">${match.matches ? `Matches your profile and training · ${match.distanceKm} km illustrative travel` : esc(match.reasons[0])}</p>` : ''}<div class="member-task-bottom"><div><strong>${money(task.payINR)}</strong><span>Payment for this completed visit</span></div>${action}</div></article>`;
}

function renderLearning(state) {
  const course = COURSES[0];
  const completed = course.lessons.filter((lesson) => state.member.completedLessons.includes(lesson.id)).length;
  const complete = certified(state, course.id);
  const certificate = state.member.certificates.find((item) => item.courseId === course.id);
  return `<div class="member-page">
    ${heading('LEARNING & CERTIFICATES', 'Build skills that grow with you.', 'Practical lessons for confident, careful work. Complete the assessment to earn your Girth certificate.')}
    <section class="member-course-hero"><div class="member-course-copy"><span class="member-overline">FOUNDATION COURSE</span><h2>${esc(course.title)}</h2><p>${esc(course.description)}</p><div class="member-course-meta"><span>${icon('clock')}${esc(course.duration || '15 minutes')}</span><span>${icon('book')}${course.lessons.length} practical lessons</span><span>${icon('shield')}Girth-issued certificate</span></div><div class="member-course-progress"><div><strong>${complete ? 'Course completed' : `${completed} of ${course.lessons.length} lessons completed`}</strong><span>${complete ? '100%' : `${Math.round(completed / course.lessons.length * 100)}%`}</span></div><progress max="${course.lessons.length}" value="${completed}" aria-label="Course lesson completion"></progress></div></div><div class="member-course-art" aria-hidden="true"><span>${icon('tree')}</span><div>Learn.<br>Care.<br>Grow.</div></div></section>
    <div class="section-heading"><h2>Your learning path</h2>${badge(complete ? 'Assessment passed' : 'Learn at your pace', complete ? 'green' : 'gray')}</div>
    <div class="member-lesson-list">${course.lessons.map((lesson, index) => {
      const done = state.member.completedLessons.includes(lesson.id);
      return `<article class="card member-lesson"><span class="member-lesson-number ${done ? 'is-done' : ''}">${done ? icon('check') : index + 1}</span><div><p class="small muted">LESSON ${index + 1}</p><h3>${esc(lesson.title)}</h3><p class="muted">${done ? 'Completed. You can revisit this lesson anytime.' : 'Read the practical guide and mark it complete.'}</p></div><button class="button button-secondary" data-action="member-lesson" data-lesson-id="${esc(lesson.id)}">${done ? 'Review lesson' : 'Start lesson'}</button></article>`;
    }).join('')}</div>
    <section class="card member-assessment"><div class="member-assessment-symbol">${icon(complete ? 'shield' : 'book')}</div><div><h2>${complete ? 'Your certificate is ready' : 'Check what you learned'}</h2><p class="muted">${complete ? 'A record of your completed Girth foundation training. This prototype certificate is clearly marked as a demo.' : 'Answer two questions after completing all three lessons. You can review the lessons and try again.'}</p></div>${complete ? button('View certificate', 'member-certificate', `data-certificate-id="${esc(certificate.id)}"`) : `<button class="button button-primary" data-action="member-quiz" ${completed < course.lessons.length ? 'disabled' : ''}>Take assessment</button>`}</section>
    <p class="member-footnote">Certificates record Girth training completion. They are not government accreditation or a promise of employment.</p>
  </div>`;
}

function renderEarnings(state) {
  const metrics = getMetrics(state);
  const payments = state.payments.filter((payment) => payment.memberId === state.member.id);
  const pending = state.tasks.filter((task) => task.assigneeId === state.member.id && task.status === 'verified');
  const charges = state.member.membership.charges;
  const ledger = [
    ...payments.map((item) => ({ id: item.id, at: item.at, title: state.tasks.find((task) => task.id === item.taskId)?.title || 'Completed care assignment', detail: 'Work payment · simulated', value: item.amountINR, kind: 'work' })),
    ...charges.map((item, index) => ({ id: item.id || `membership-${index}`, at: item.at || item.paidAt || item.startedAt, title: 'Green Network membership', detail: '30 subscribed days · simulated', value: -(item.amountINR ?? 300), kind: 'membership' }))
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return `<div class="member-page">
    ${heading('EARNINGS', 'Every task. Every payment.', 'Your work payments and membership charges are recorded separately, so you can see what you retain.')}
    <div class="grid-three member-stats">${stat('Paid work earnings', money(metrics.memberEarnedINR), 'Approved and paid assignments', 'wallet')}${stat('Awaiting payment', money(metrics.memberPendingINR), `${pending.length} approved assignment${pending.length === 1 ? '' : 's'}`, 'clock')}${stat('Membership charges', money(metrics.membershipFeesINR), '₹10 for each subscribed day', 'leaf')}</div>
    <section class="member-net"><div><p>Work earnings after membership</p><strong>${money(metrics.memberNetINR)}</strong><span>Before tax and any unreimbursed work expenses</span></div><div class="member-net-note">${icon('shield')}<p>All payments in this prototype are simulated. No bank transfer or real charge is made.</p></div></section>
    <section class="card member-ledger"><div class="card-header"><div><p class="eyebrow">YOUR RECORD</p><h2 class="card-title">Payment activity</h2></div>${badge(`${ledger.length} entries`, 'gray')}</div>${ledger.length ? `<div class="member-ledger-list">${ledger.map((item) => `<div class="member-ledger-row"><span class="member-ledger-icon ${item.kind}">${icon(item.kind === 'work' ? 'wallet' : 'leaf')}</span><div><strong>${esc(item.title)}</strong><span>${esc(item.detail)} · ${fmtDate(item.at)}</span></div><strong class="member-ledger-amount ${item.kind}">${item.value >= 0 ? '+' : '−'}${money(Math.abs(item.value))}</strong></div>`).join('')}</div>` : `<div class="empty-state">${icon('wallet')}<h3>Your first payment starts with a task</h3><p>Complete a funded assignment. Operations reviews it and records your demo payment.</p><button class="button button-secondary" data-action="member-go-opportunities">Find an opportunity</button></div>`}</section>
    ${pending.length ? `<section class="card member-pending"><h2 class="card-title">Approved, waiting for payment</h2>${pending.map((task) => `<div class="row spread"><span>${esc(task.title)}</span><strong>${money(task.payINR)}</strong></div>`).join('')}<p class="muted small">Switch to Operations to record the demo payment. Pausing membership does not prevent payment for completed work.</p></section>` : ''}
  </div>`;
}

function renderMembership(state) {
  const active = isMembershipActive(state);
  const member = state.member;
  return `<div class="member-page">
    ${heading('YOUR MEMBERSHIP', 'A small fee. Useful opportunities.', 'Learning, business tools and a local network, with a clear daily price and control over your membership.')}
    <div class="member-membership-layout"><section class="member-price-card"><div class="row spread"><span class="member-overline">GIRTH GREEN NETWORK</span>${badge(active ? 'Active pass' : 'Ready to join', active ? 'green' : 'gray')}</div><div class="member-price">₹10<span>/ subscribed day</span></div><p class="member-price-period">₹300 for a 30-day demo pass</p><div class="member-membership-benefits"><div>${icon('briefcase')}<span>Local paid-work opportunities</span></div><div>${icon('book')}<span>Practical training and assessment</span></div><div>${icon('shield')}<span>Certificates and a work record</span></div></div><p class="member-membership-disclosure">The fee covers subscribed days, including days without work. Opportunities depend on customer demand and your skills. Income is not guaranteed.</p>${active ? `<div class="member-active-pass"><div class="row spread"><span>Access until</span><strong>${fmtDate(member.membership.paidUntil)}</strong></div><div class="row spread"><span>Future renewal</span><strong>${member.membership.autoRenew ? 'Enabled in demo' : 'Paused'}</strong></div><button class="button button-light" data-action="${member.membership.autoRenew ? 'member-pause' : 'member-resume'}">${member.membership.autoRenew ? 'Pause future renewal' : 'Resume future renewal'}</button><p>Pausing keeps access until your current pass ends.</p></div>` : `<form data-member-form="membership" class="member-membership-form"><label class="member-check"><input type="checkbox" name="acceptedTerms" required><span>I understand the ₹300 / 30-day price, that work is not guaranteed, and that renewal is simulated.</span></label><p class="member-form-error" role="alert" hidden></p><button class="button button-light" type="submit">Activate demo membership</button></form>`}<p class="member-no-charge">${icon('shield')}No real payment. No automatic billing.</p></section>
    <div class="member-membership-right"><section class="card member-membership-story"><span class="member-story-icon">${icon('users')}</span><h2>A network you can grow with.</h2><p>Build a record of the skills you learn and the work you complete. Use it to take on suitable assignments and develop customer relationships.</p><div class="member-story-detail"><strong>Start with the essentials</strong><span>Learn how to plant, water and report tree condition.</span></div><div class="member-story-detail"><strong>Agree the work before you start</strong><span>See task scope, estimated hours and payment before accepting.</span></div><div class="member-story-detail"><strong>Keep your earnings visible</strong><span>Track work payments and membership costs separately.</span></div><button class="button button-secondary" data-action="member-go-learning">Explore the training</button></section><section class="member-fair-note">${icon('shield')}<div><h3>Your work deserves clear terms</h3><p>Membership is optional. Earned work payments are never held back because you pause your pass. Certificates are Girth-issued, not accredited qualifications.</p></div></section></div></div>
  </div>`;
}

function renderProfile(state) {
  const profile = state.member.profile;
  const selected = (actual, expected) => actual === expected ? 'selected' : '';
  const matching = state.tasks.filter(task => task.status === 'available' && getTaskMatch(state, task).profileMatch).length;
  return `<div class="member-page">${heading('YOUR PROFILE', 'Your details. Work that fits.', 'Tell us where and when you can work. Your profile and training are free; no membership payment is needed to get started.')}
    <div class="member-profile-layout"><form data-member-form="profile" class="card member-profile-form"><div class="card-header"><h2 class="card-title">Work preferences</h2>${badge(profile.saved ? 'Profile saved' : 'Start here', profile.saved ? 'green' : 'orange')}</div><div class="member-profile-fields"><label class="field">Your name<input type="text" name="name" value="${esc(state.member.name)}" minlength="2" maxlength="80" autocomplete="name" required></label><label class="field">Village or town<select name="village" required>${PROFILE_OPTIONS.villages.map(village => `<option value="${village}" ${selected(profile.village, village)}>${village}</option>`).join('')}</select></label><label class="field">Available day each week<select name="availabilityDay" required>${PROFILE_OPTIONS.days.map(day => `<option value="${day}" ${selected(profile.availabilityDay, day)}>${day}</option>`).join('')}</select></label><label class="field">How will you travel?<select name="transport" required>${PROFILE_OPTIONS.transport.map(item => `<option value="${item.value}" ${selected(profile.transport, item.value)}>${item.label}</option>`).join('')}</select></label><label class="field">Maximum travel distance (km)<input type="number" name="travelRadiusKm" value="${profile.travelRadiusKm}" min="1" max="30" step="1" required><span class="small muted">Choose 1–30 km that you can travel reliably.</span></label></div><fieldset class="member-interest-fields"><legend>What would you like to do?</legend>${PROFILE_OPTIONS.interests.map(item => `<label><input type="checkbox" name="interests" value="${item.value}" ${profile.interests.includes(item.value) ? 'checked' : ''}><span>${item.label}</span></label>`).join('')}</fieldset><p class="member-form-error" role="alert" hidden></p><div class="member-profile-submit"><span class="muted small">Saved in this browser for the demo.</span><button class="button button-primary" type="submit">Save profile and find work</button></div></form>
    <aside class="member-profile-aside"><section class="member-profile-preview"><span class="member-profile-avatar">${esc(state.member.name.split(' ').filter(Boolean).slice(0, 2).map(name => name[0]).join(''))}</span><h2>${esc(state.member.name)}</h2><p>${esc(profile.village)} · ${esc(profile.availabilityDay)}</p><div>${badge(profile.saved ? `${matching} visits fit your preferences` : 'Complete your profile', profile.saved ? 'green' : 'gray')}</div><p class="member-profile-preview-note">Training, membership and the earlier visit’s completion are checked before you can accept an assignment.</p></section><section class="card member-matching-guide"><h3>How matching works</h3><p>We compare your location, available day, travel preferences, interests and completed training with each assignment.</p><p>Demo travel assumptions: Kandi is 3 km from the site and Sangareddy is 12 km. Walking is limited to 5 km, cycling to 15 km and other transport to 30 km. These are not measured routes.</p><p>For other locations, this demo shows no nearby match. Saving a profile does not guarantee work.</p></section></aside></div></div>`;
}

function renderCommunity(state) {
  return `<div class="member-page">${heading('GREEN COMMUNITY', 'Grow your skills. Grow your network.', 'Explore learning circles and small-business opportunities. Save an interest to your profile, then return to it anytime.')}
    <div class="member-community-banner"><div>${icon('users')}<h2>Good opportunities start with a connection.</h2><p>Meet peers, understand nursery work and learn how to build a small green-service business.</p></div><strong>${state.member.communityInterests.length}<span>interests saved</span></strong></div>
    <p class="member-demo-label">All organisations and openings below are fictional demo examples. Saving interest sends no application or external message.</p>
    <div class="member-community-grid">${COMMUNITY_OPPORTUNITIES.map(opportunity => {
      const saved = state.member.communityInterests.some(item => item.opportunityId === opportunity.id);
      return `<article class="card member-community-card"><div class="row spread"><span class="member-task-icon">${icon(opportunity.icon)}</span>${badge(opportunity.kind, 'gray')}</div><p class="member-community-partner">${esc(opportunity.partner)} · demo organisation</p><h2>${esc(opportunity.title)}</h2><p>${esc(opportunity.detail)}</p><span class="member-community-location">${icon('pin')}${esc(opportunity.location)}</span><button class="button ${saved ? 'button-secondary' : 'button-primary'}" data-action="member-interest" data-opportunity-id="${opportunity.id}" ${saved ? 'disabled' : ''}>${saved ? 'Interest saved to your profile' : 'Save my interest'}</button></article>`;
    }).join('')}</div><section class="card member-community-next"><div><h2 class="card-title">Build a record you can share</h2><p class="muted">Your completed training and reviewed care work help you explain your experience when a real opportunity becomes available.</p></div><button class="button button-secondary" data-action="member-go-learning">View learning and certificates</button></section></div>`;
}

export function renderMember(state, tab) {
  if (tab === 'profile') return renderProfile(state);
  if (tab === 'community') return renderCommunity(state);
  if (tab === 'learning') return renderLearning(state);
  if (tab === 'earnings') return renderEarnings(state);
  if (tab === 'membership') return renderMembership(state);
  return renderOpportunities(state);
}

function showFormError(form, error) {
  let target = form.querySelector('.member-form-error');
  if (!target) {
    target = document.createElement('p');
    target.className = 'member-form-error';
    target.setAttribute('role', 'alert');
    form.append(target);
  }
  target.textContent = error.message || 'This action could not be completed. Check the details and try again.';
  target.hidden = false;
  target.scrollIntoView({ block: 'nearest' });
}

const LESSON_STEPS = {
  'planting-basics': [
    ['Check the site', 'Use the agreed species and spacing. Confirm that water and protection are ready.'],
    ['Set the right level', 'Keep the root collar at soil level. Support the root ball gently without crushing it.'],
    ['Finish and protect', 'Firm the surrounding soil and leave a clear space between mulch and the trunk.'],
  ],
  'watering-and-care': [
    ['Check moisture first', 'Look at soil moisture and the weather before deciding how much water is needed.'],
    ['Water the root zone', 'Apply water slowly around the roots using the site’s instructions. Avoid an uncontrolled flood.'],
    ['Check and report', 'Inspect irrigation for leaks and blockages. Tell the site lead about damaged or unhealthy trees.'],
  ],
  'recording-evidence': [
    ['Identify the trees', 'Record the assigned tree group and check every tree in the visit scope.'],
    ['Measure consistently', 'Use the same agreed measurement method and record the condition you actually observed.'],
    ['Submit honest evidence', 'Add your work notes and dated evidence. Report problems rather than hiding them.'],
  ],
};

function lessonDiagram(lessonId, step) {
  const stepData = LESSON_STEPS[lessonId];
  const label = stepData[step][0];
  let drawing;
  if (lessonId === 'planting-basics') drawing = `<path d="M20 120H380V178H20Z" fill="#d8b58a"/><path d="M20 120H380" stroke="#a47d53" stroke-width="3"/><path class="diagram-focus" d="M173 120Q160 165 200 169Q240 165 227 120" fill="#876242"/><path d="M200 129V55" stroke="#795b36" stroke-width="8" stroke-linecap="round"/><path d="M200 96Q141 90 156 53Q191 52 200 80M200 79Q207 36 247 37Q250 76 205 89" fill="#4f8050"/><path d="M190 135L178 151M205 137L220 153M200 143V161" stroke="#e1c39c" stroke-width="3"/><path d="M105 117H170M230 117H298" stroke="#b18b55" stroke-width="9" stroke-linecap="round"/><circle class="diagram-focus" cx="200" cy="120" r="${step === 1 ? 15 : 5}" fill="none" stroke="#3e794d" stroke-width="3"/><path d="M215 120H322V89" fill="none" stroke="#52734d" stroke-width="1.5"/><text x="265" y="76" fill="#34543c" font-size="12" text-anchor="middle">Root collar at soil level</text>`;
  else if (lessonId === 'watering-and-care') drawing = `<path d="M20 128H380V178H20Z" fill="#d8b58a"/><ellipse class="diagram-focus" cx="200" cy="132" rx="72" ry="17" fill="${step === 1 ? '#80b7c7' : '#b8c6a0'}" opacity=".65"/><path d="M200 132V64" stroke="#795b36" stroke-width="7" stroke-linecap="round"/><path d="M200 99Q156 86 166 57Q191 58 200 79M200 83Q218 43 247 56Q243 90 203 97" fill="#4f8050"/><path d="M56 90H110V118H56ZM109 92L147 111L143 120L107 107" fill="#678d81"/><path d="M63 91V79Q83 59 100 80V91" fill="none" stroke="#678d81" stroke-width="7"/><g class="diagram-water" stroke="#559bad" stroke-width="3" stroke-linecap="round"><path d="M147 119L157 126"/><path d="M155 115L169 128"/><path d="M163 112L181 129"/></g><path d="M277 142V114H342" stroke="#59817a" stroke-width="5" fill="none"/><text x="289" y="97" fill="#34543c" font-size="12" text-anchor="middle">Check the irrigation</text><path d="M182 145L170 164M207 145L224 166M199 145V170" stroke="#876242" stroke-width="3"/>`;
  else drawing = `<rect x="115" y="22" width="170" height="145" rx="10" fill="white" stroke="#9caf93" stroke-width="2"/><rect x="164" y="15" width="72" height="20" rx="6" fill="#5c7c56"/><g font-size="13" fill="#34543c"><text x="152" y="65">25 trees checked</text><text x="152" y="100">Condition recorded</text><text x="152" y="135">Care notes added</text></g><g class="diagram-focus" fill="none" stroke="#4f8050" stroke-width="3" stroke-linecap="round"><path d="M130 59L136 65L144 54"/>${step > 0 ? '<path d="M130 94L136 100L144 89"/>' : ''}${step > 1 ? '<path d="M130 129L136 135L144 124"/>' : ''}</g><path d="M313 117V71" stroke="#795b36" stroke-width="5"/><path d="M313 90Q285 77 294 58Q313 59 313 76M313 76Q327 49 345 58Q343 82 315 87" fill="#4f8050"/>`;
  return `<div class="member-visual-lesson"><svg viewBox="0 0 400 190" role="img" aria-label="${esc(label)}: ${esc(stepData[step][1])}"><rect width="400" height="190" rx="14" fill="#eef4e7"/>${drawing}</svg><div class="member-visual-step"><span>STEP ${step + 1} OF 3</span><h3>${esc(label)}</h3><p>${esc(stepData[step][1])}</p></div><div class="member-visual-controls" role="group" aria-label="Choose lesson step">${stepData.map((item, index) => `<button type="button" class="${step === index ? 'is-active' : ''}" data-action="member-lesson-step" data-lesson-id="${lessonId}" data-step="${index}" aria-pressed="${step === index}">${index + 1}. ${esc(item[0])}</button>`).join('')}</div></div>`;
}

function lessonModal(state, lessonId, step = 0) {
  const course = COURSES.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  const lesson = course?.lessons.find((item) => item.id === lessonId);
  if (!lesson) throw new Error('This lesson is not available.');
  const body = Array.isArray(lesson.body) ? lesson.body : String(lesson.body).split('\n').filter(Boolean);
  const done = state.member.completedLessons.includes(lesson.id);
  return `<div class="member-modal"><p class="eyebrow">${esc(course.title)}</p><h2>${esc(lesson.title)}</h2>${lessonDiagram(lessonId, Math.max(0, Math.min(2, step)))}<details class="member-lesson-details"><summary>Read the full practical guide</summary><div class="member-lesson-body">${body.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}</div></details><div class="member-lesson-tip">${icon('leaf')}<p>Use the project’s actual care instructions on site. If a tree or irrigation system needs attention, report it to your supervisor.</p></div><button class="button button-primary" data-action="member-complete-lesson" data-lesson-id="${esc(lesson.id)}">${done ? 'Lesson complete · close' : 'Mark lesson complete'}</button></div>`;
}

function quizModal() {
  const course = COURSES[0];
  return `<div class="member-modal"><p class="eyebrow">FOUNDATION ASSESSMENT</p><h2>Put your knowledge into practice.</h2><p class="muted">Answer both questions correctly to earn your demo certificate.</p><form data-member-form="quiz" data-course-id="${esc(course.id)}">${course.questions.map((question, index) => `<fieldset class="member-quiz-question"><legend>${index + 1}. ${esc(question.prompt)}</legend>${question.options.map((option) => `<label class="member-quiz-option"><input type="radio" name="${esc(question.id)}" value="${esc(option.value)}" required><span>${esc(option.label)}</span></label>`).join('')}</fieldset>`).join('')}<p class="member-form-error" role="alert" hidden></p><button class="button button-primary" type="submit">Check answers</button></form></div>`;
}

function reportModal(task) {
  return `<div class="member-modal"><p class="eyebrow">CARE REPORT</p><h2>${esc(task.title)}</h2><p class="muted">Complete the full assignment: check all ${task.trees} trees before submitting. Operations reviews the full task before payment.</p><form data-member-form="report" data-task-id="${esc(task.id)}"><div class="member-report-fields"><label class="field">Trees checked<input type="number" name="checkedTrees" min="${task.trees}" max="${task.trees}" value="${task.trees}" step="1" required></label><label class="field">Healthy trees observed<input type="number" name="healthyTrees" min="0" max="${task.trees}" value="${task.trees}" step="1" required></label><label class="field">Representative height (cm)<input type="number" name="heightCm" min="5" max="1000" value="120" step="0.1" required></label></div><label class="field">Work completed and observations<textarea name="note" minlength="10" maxlength="500" rows="4" placeholder="Describe the care completed and anything that needs attention." required></textarea></label><div class="member-report-image"><img src="./assets/care.jpg" alt="Illustrative photograph of planting a sapling, not evidence of this task"><div><strong>Illustrative demo photo</strong><p>This sample image demonstrates the report layout. It is not field evidence.</p></div></div><p class="member-form-error" role="alert" hidden></p><button class="button button-primary" type="submit">Submit report for review</button></form></div>`;
}

function viewReportModal(task) {
  const report = task.submission;
  if (!report) throw new Error('This task has no submitted report yet.');
  return `<div class="member-modal"><p class="eyebrow">SUBMITTED REPORT</p><h2>${esc(task.title)}</h2>${badge(titleCase(task.status), task.status === 'submitted' ? 'orange' : 'green')}<div class="member-report-summary"><div><span>Trees checked</span><strong>${report.checkedTrees}</strong></div><div><span>Healthy observed</span><strong>${report.healthyTrees}</strong></div><div><span>Height recorded</span><strong>${report.heightCm} cm</strong></div></div><h3>Field notes</h3><p class="member-lesson-body">${esc(report.note)}</p><p class="muted small">Submitted ${fmtDate(report.at)} · Photo is an illustrative demo, not field evidence.</p><p class="muted small">${task.status === 'submitted' ? 'Next: Operations reviews your report.' : task.status === 'verified' ? 'Your report is approved. Operations can now record the demo payment.' : 'Your demo payment has been recorded in Earnings.'}</p></div>`;
}

function certificateMarkup(state, certificate) {
  return `<div class="member-certificate"><span class="member-certificate-brand">girth<span>●</span></span><p>GIRTH GREEN NETWORK</p><h2>Certificate of completion</h2><span class="member-certificate-label">Presented to</span><strong class="member-certificate-name">${esc(state.member.name)}</strong><p>For completing the learning and assessment for</p><h3>${esc(certificate.title || courseFor(certificate.courseId)?.title || 'Tree care foundations')}</h3><div class="member-certificate-rule"></div><p>Issued ${fmtDate(certificate.issuedAt)}<br>Certificate ${esc(certificate.id)}</p><div class="member-certificate-demo">DEMO · GIRTH-ISSUED · NOT AN ACCREDITED QUALIFICATION</div></div>`;
}

function downloadCertificate(state, certificate) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Girth demo certificate</title><style>body{font-family:Arial,sans-serif;color:#18372b;background:#f5f8f4;margin:0;padding:48px}.member-certificate{max-width:760px;margin:auto;padding:56px;text-align:center;border:2px solid #184c3a;background:white}.member-certificate-brand{font-size:32px;font-weight:800}.member-certificate-brand span{color:#8bb752}h2{font-size:32px;margin-top:40px}.member-certificate-label{display:block;margin:32px 0 12px}.member-certificate-name{display:block;font-size:36px}p{line-height:1.7;color:#61736a}.member-certificate-rule{height:1px;background:#c9d7c8;margin:32px}.member-certificate-demo{font-size:12px;background:#edf3e5;padding:12px;letter-spacing:1px;margin-top:30px}@media(max-width:600px){body{padding:16px}.member-certificate{padding:24px}.member-certificate-name{font-size:28px}}@media print{body{background:white;padding:0}}</style></head><body>${certificateMarkup(state, certificate)}</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `girth-demo-certificate-${certificate.id}.html`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function handleMemberAction(action, element, ctx) {
  if (!action.startsWith('member-')) return false;
  const state = ctx.getState();
  try {
    if (action === 'member-go-membership') ctx.navigate('member', 'membership');
    else if (action === 'member-go-profile') ctx.navigate('member', 'profile');
    else if (action === 'member-go-community') ctx.navigate('member', 'community');
    else if (action === 'member-go-learning') ctx.navigate('member', 'learning');
    else if (action === 'member-go-opportunities') ctx.navigate('member', 'opportunities');
    else if (action === 'member-filter') { opportunityFilter = element.dataset.filter === 'mine' ? 'mine' : 'all'; ctx.navigate('member', 'opportunities'); }
    else if (action === 'member-claim') { ctx.dispatch({ type: 'CLAIM_TASK', taskId: element.dataset.taskId }); ctx.toast('Assignment accepted. Your care report is ready to complete.'); }
    else if (action === 'member-report' || action === 'member-view-report') {
      const task = state.tasks.find((item) => item.id === element.dataset.taskId);
      if (!task) throw new Error('This assignment is no longer available.');
      ctx.openModal(action === 'member-report' ? reportModal(task) : viewReportModal(task));
    } else if (action === 'member-lesson') ctx.openModal(lessonModal(state, element.dataset.lessonId));
    else if (action === 'member-lesson-step') ctx.openModal(lessonModal(state, element.dataset.lessonId, Number(element.dataset.step)));
    else if (action === 'member-interest') {
      if (!state.member.profile.saved) { ctx.navigate('member', 'profile'); ctx.toast('Create your free profile first, then save your community interests.'); }
      else { ctx.dispatch({ type: 'RECORD_COMMUNITY_INTEREST', opportunityId: element.dataset.opportunityId }); ctx.toast('Interest saved to your profile. No application was sent.'); }
    }
    else if (action === 'member-complete-lesson') { ctx.dispatch({ type: 'COMPLETE_LESSON', lessonId: element.dataset.lessonId }); ctx.closeModal(); ctx.toast('Lesson completed.'); }
    else if (action === 'member-quiz') ctx.openModal(quizModal());
    else if (action === 'member-certificate') {
      const certificate = state.member.certificates.find((item) => item.id === element.dataset.certificateId);
      if (!certificate) throw new Error('Complete the assessment to earn your certificate.');
      ctx.openModal(`<div class="member-modal member-certificate-modal">${certificateMarkup(state, certificate)}<button class="button button-primary" data-action="member-download-certificate" data-certificate-id="${esc(certificate.id)}">${icon('download')}Download demo certificate</button></div>`);
    } else if (action === 'member-download-certificate') {
      const certificate = state.member.certificates.find((item) => item.id === element.dataset.certificateId);
      if (!certificate) throw new Error('This certificate was not found.');
      downloadCertificate(state, certificate);
      ctx.toast('Demo certificate downloaded.');
    } else if (action === 'member-pause') { ctx.dispatch({ type: 'PAUSE_MEMBERSHIP' }); ctx.toast('Future renewal paused. Your current pass remains valid.'); }
    else if (action === 'member-resume') { ctx.dispatch({ type: 'RESUME_MEMBERSHIP' }); ctx.toast('Demo renewal enabled. No real billing will occur.'); }
    else return false;
  } catch (error) { ctx.toast(error.message || 'Unable to complete this action.'); }
  return true;
}

export function handleMemberSubmit(form, ctx) {
  const kind = form.dataset.memberForm;
  if (!kind) return false;
  const data = new FormData(form);
  try {
    if (kind === 'profile') {
      ctx.dispatch({ type: 'SAVE_MEMBER_PROFILE', name: data.get('name'), village: data.get('village'), availabilityDay: data.get('availabilityDay'), transport: data.get('transport'), travelRadiusKm: Number(data.get('travelRadiusKm')), interests: data.getAll('interests') });
      ctx.toast('Profile saved. Opportunities now reflect your preferences.');
      ctx.navigate('member', 'opportunities');
    } else if (kind === 'membership') {
      ctx.dispatch({ type: 'ACTIVATE_MEMBERSHIP', acceptedTerms: data.get('acceptedTerms') === 'on' });
      ctx.toast('Demo membership activated for 30 days. No payment was charged.');
    } else if (kind === 'quiz') {
      const answers = Object.fromEntries(data.entries());
      ctx.dispatch({ type: 'COMPLETE_TRAINING', courseId: form.dataset.courseId, answers });
      ctx.closeModal();
      ctx.toast('Assessment passed. Your demo certificate is ready.');
    } else if (kind === 'report') {
      ctx.dispatch({ type: 'SUBMIT_TASK', taskId: form.dataset.taskId, note: data.get('note'), checkedTrees: Number(data.get('checkedTrees')), healthyTrees: Number(data.get('healthyTrees')), heightCm: Number(data.get('heightCm')) });
      ctx.closeModal();
      ctx.toast('Care report submitted. Operations can now review it.');
    } else return false;
  } catch (error) { showFormError(form, error); }
  return true;
}
