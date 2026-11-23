import { icon } from './ui.js';

// The initial illustration and links do not depend on the 3D module loading.
function treeFallback() {
  return `<svg class="girth-scene-fallback" viewBox="0 0 640 570" role="img" aria-label="A flourishing tree rooted in a small green island"><defs><linearGradient id="landing-soil" x2="0" y2="1"><stop stop-color="#b18a5e"/><stop offset="1" stop-color="#73513c"/></linearGradient><linearGradient id="landing-leaf" x2=".7" y2="1"><stop stop-color="#9fbd69"/><stop offset="1" stop-color="#365b38"/></linearGradient><radialGradient id="landing-shadow"><stop stop-color="#537c5b" stop-opacity=".2"/><stop offset="1" stop-color="#537c5b" stop-opacity="0"/></radialGradient></defs><ellipse cx="320" cy="502" rx="180" ry="29" fill="url(#landing-shadow)"/><path d="M151 429c28-57 304-61 338 0l-26 38c-63 38-222 29-280-4Z" fill="url(#landing-soil)"/><ellipse cx="320" cy="424" rx="170" ry="48" fill="#a5b67b"/><ellipse cx="318" cy="421" rx="149" ry="33" fill="#b8c790"/><path d="M315 430c-13-57 1-98-9-133-17-28-46-44-67-67m77 105c20-59 50-69 84-92m-83 81c-2-68 15-113 8-152m-11 221c-21-29-35-42-64-49" fill="none" stroke="#796044" stroke-width="21" stroke-linecap="round"/><path d="M316 400c-4 23-36 27-61 32m66-25c7 22 35 25 65 25m-71-19c-10 14-12 24-12 32" fill="none" stroke="#796044" stroke-width="9" stroke-linecap="round"/><g fill="url(#landing-leaf)"><ellipse cx="243" cy="222" rx="74" ry="65"/><ellipse cx="321" cy="162" rx="85" ry="75"/><ellipse cx="400" cy="219" rx="77" ry="70"/><ellipse cx="306" cy="241" rx="89" ry="78"/><ellipse cx="218" cy="265" rx="55" ry="52"/><ellipse cx="419" cy="276" rx="59" ry="53"/><ellipse cx="351" cy="286" rx="72" ry="54"/></g><g fill="#adca78" opacity=".6"><ellipse cx="271" cy="166" rx="43" ry="35"/><ellipse cx="345" cy="135" rx="46" ry="30"/><ellipse cx="387" cy="205" rx="38" ry="34"/><ellipse cx="238" cy="242" rx="33" ry="25"/></g><g stroke="#6f8c4f" stroke-width="3" stroke-linecap="round"><path d="m222 425 2-14m0 10-8-5m190 12-1-16m0 9 7-6m-163 34-3-12m112 10 3-15"/></g><g fill="#cfccb7"><ellipse cx="211" cy="440" rx="10" ry="6"/><ellipse cx="395" cy="440" rx="13" ry="7"/><ellipse cx="424" cy="417" rx="7" ry="5"/></g></svg>`;
}

export function renderLanding() {
  return `<div class="landing">
    <header class="landing-header">
      <a class="landing-brand" href="#/" aria-label="Girth home"><img src="./favicon.svg" alt=""><span>girth<span>.</span></span></a>
      <nav class="landing-nav" aria-label="Introduction"><a href="#landing-how">How it works</a><button type="button" data-action="enter-member">For caretakers</button><button type="button" class="landing-nav-cta" data-action="enter-sponsor">Explore a grove</button></nav>
    </header>
    <main id="view" class="landing-main" tabindex="-1">
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-heading"><span class="landing-eyebrow">ROOTED IN CARE. GROWN TOGETHER.</span><h1 id="landing-title">Good things<br><span>grow together.</span></h1><p>People who plant possibility.<br class="landing-mobile-break"> People who help it thrive.</p></div>
        <div class="landing-branch-stage">
          <div class="landing-branch landing-branch-sponsor"><span class="landing-path-icon">${icon('tree')}</span><p class="landing-path-label">FOR SPONSORS</p><h2>Grow an Impact</h2><p>Give a tree its beginning.<br> Follow the care that comes after.</p><button type="button" class="landing-button landing-button-forest" data-action="enter-sponsor">Grow an Impact</button><span class="landing-path-note">For people, teams & organisations</span></div>
          <div class="landing-tree-wrap"><div class="landing-tree-scene" data-landing-tree>${treeFallback()}</div><div class="landing-tree-caption"><span>One tree. Many possibilities.</span><button type="button" class="landing-motion-control" data-scene-pause aria-pressed="false" hidden>Pause animation</button></div></div>
          <div class="landing-branch landing-branch-member"><span class="landing-path-icon">${icon('users')}</span><p class="landing-path-label">FOR CARETAKERS</p><h2>Earn & Grow</h2><p>Care for a greener neighbourhood.<br> Build skills. Get paid for your work.</p><button type="button" class="landing-button landing-button-outline" data-action="enter-member">Earn & Grow</button><span class="landing-path-note">Local opportunities. Practical skills.</span></div>
        </div>
        <div class="landing-demo-note">${icon('shield')}<span>Explore the interactive prototype. Sample projects, simulated payments.</span></div>
      </section>

      <section class="landing-how" id="landing-how" aria-labelledby="landing-how-title">
        <div class="landing-how-heading"><span class="landing-eyebrow">A SMALL START. A LASTING RESPONSIBILITY.</span><h2 id="landing-how-title">A tree needs a whole circle of care.</h2><p>Girth brings the people, the work and the progress into one place.</p></div>
        <div class="landing-steps">
          <article><span class="landing-step-icon">${icon('plant')}</span><div><h3>Fund a beginning</h3><p>A sponsor supports planting and a defined period of care at a shared site.</p></div></article>
          <article><span class="landing-step-icon">${icon('leaf')}</span><div><h3>Care becomes opportunity</h3><p>Local caretakers learn useful skills, complete visits and earn for verified work.</p></div></article>
          <article><span class="landing-step-icon">${icon('report')}</span><div><h3>See the story grow</h3><p>Follow tree condition, completed care and the payments that support local people.</p></div></article>
        </div>
      </section>

      <section class="landing-offers" aria-label="Explore both sides of Girth">
        <article class="landing-offer landing-offer-sponsor"><div><span class="landing-eyebrow">SPONSOR A TREE</span><h2>A little funding.<br>A future worth tending.</h2><p>Explore the proposed three-year care package and see how a funded grove is looked after.</p><button type="button" class="landing-button landing-button-forest" data-action="enter-sponsor">Explore sponsorship</button></div><div class="landing-offer-number"><span>Target price</span><strong>₹600</strong><span>per tree, including planned care</span><small>Illustrative target. Actual costs and site arrangements require validation.</small></div></article>
        <article class="landing-offer landing-offer-member"><div><span class="landing-eyebrow">BECOME A CARETAKER</span><h2>Good work starts<br>close to home.</h2><p>Build a work record through paid care visits, practical learning and Girth-issued certificates.</p><button type="button" class="landing-button landing-button-outline" data-action="enter-member">Explore care opportunities</button></div><div class="landing-offer-number"><span>Example care assignment</span><strong>₹300</strong><span>per completed weekly visit</span><small>Four visits = ₹1,200. Work availability and income are not guaranteed. All payouts in this prototype are simulated.</small></div></article>
      </section>
    </main>
    <footer class="landing-footer"><a class="landing-footer-wordmark" href="#/">girth.</a><p>Growing trees. Growing opportunity.</p><a href="./credits.html" target="_blank" rel="noopener">About this prototype</a></footer>
  </div>`;
}

/** Navigation actions are handled by app.js so a click is never routed twice. */
export function mountLanding(rootElement, { navigate } = {}) {
  void navigate;
  const scene = rootElement.querySelector('[data-landing-tree]');
  const pauseButton = rootElement.querySelector('[data-scene-pause]');
  let disposed = false, stopScene = () => {};
  import('./tree-scene.js').then(({ mountTree }) => {
    if (!disposed && scene?.isConnected) stopScene = mountTree(scene, { pauseButton });
  }).catch(error => console.warn('Girth is using its static landing illustration:', error.message));
  const howLink = rootElement.querySelector('a[href="#landing-how"]');
  const scrollToHow = event => { event.preventDefault(); rootElement.querySelector('#landing-how')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); };
  howLink?.addEventListener('click', scrollToHow);
  return () => { disposed = true; stopScene(); howLink?.removeEventListener('click', scrollToHow); };
}
