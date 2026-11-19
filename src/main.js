const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const menuLabel = document.querySelector('.menu-label');
const siteNav = document.querySelector('.site-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 24);
}

function closeMenu(returnFocus = false) {
  header.classList.remove('nav-open');
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuLabel.textContent = 'Menu';
  if (returnFocus) menuToggle.focus();
}

menuToggle.addEventListener('click', () => {
  const willOpen = !header.classList.contains('nav-open');
  header.classList.toggle('nav-open', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
  menuToggle.setAttribute('aria-expanded', String(willOpen));
  menuLabel.textContent = willOpen ? 'Fermer' : 'Menu';
  if (willOpen) siteNav.querySelector('a').focus();
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => closeMenu());
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && header.classList.contains('nav-open')) closeMenu(true);
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 900 && header.classList.contains('nav-open')) closeMenu();
});
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
document.getElementById('year').textContent = new Date().getFullYear();

let workTween = null;
const workViewport = document.querySelector('.work-viewport');
const workTrack = document.querySelector('.work-track');
const projectCards = [...document.querySelectorAll('.project-card')];

function setupMotion() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero-card', {
    opacity: 0,
    y: 28,
    scale: 0.98,
    duration: 0.85,
    ease: 'power3.out',
    clearProps: 'all'
  });

  gsap.to('.hero-media img', {
    yPercent: 8,
    scale: 1.06,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 }
  });

  gsap.to('.manifesto-small', {
    y: -46,
    ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
  });

  if (window.innerWidth < 900) return;
  const distance = () => Math.max(0, workTrack.scrollWidth - window.innerWidth + window.innerWidth * 0.05);
  if (distance() <= 0) return;

  document.body.classList.add('has-scrolltrigger');
  workTween = gsap.to(workTrack, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.work-section',
      start: 'top top',
      end: () => `+=${distance() + window.innerWidth * 0.35}`,
      pin: '.work-pin',
      scrub: 0.65,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });
}

function moveWork(direction) {
  if (workTween && window.innerWidth >= 900) {
    const trigger = workTween.scrollTrigger;
    const current = Math.round(trigger.progress * (projectCards.length - 1));
    const target = (current + direction + projectCards.length) % projectCards.length;
    const progress = target / (projectCards.length - 1);
    window.scrollTo({
      top: trigger.start + (trigger.end - trigger.start) * progress,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    return;
  }

  const amount = workViewport.clientWidth * 0.82 * direction;
  const atStart = workViewport.scrollLeft <= 4;
  const atEnd = workViewport.scrollLeft + workViewport.clientWidth >= workViewport.scrollWidth - 4;
  if (direction > 0 && atEnd) {
    workViewport.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  } else if (direction < 0 && atStart) {
    workViewport.scrollTo({ left: workViewport.scrollWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
  } else {
    workViewport.scrollBy({ left: amount, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

document.querySelector('.work-prev').addEventListener('click', () => moveWork(-1));
document.querySelector('.work-next').addEventListener('click', () => moveWork(1));

const packageSelect = document.getElementById('package-select');
document.querySelectorAll('.package-button').forEach((button) => {
  button.addEventListener('click', () => {
    packageSelect.value = button.dataset.package;
    document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    window.setTimeout(() => packageSelect.focus({ preventScroll: true }), reduceMotion ? 0 : 550);
  });
});

const briefForm = document.getElementById('brief-form');
const briefResult = document.getElementById('brief-result');
const briefPreview = document.getElementById('brief-preview');
const copyStatus = document.getElementById('copy-status');
let currentBrief = '';

briefForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(briefForm);
  currentBrief = [
    'BONJOUR STUDIOKAPT,',
    '',
    'Je souhaite échanger au sujet d’un projet de contenu.',
    '',
    `Contact : ${data.get('name')}`,
    `Entreprise : ${data.get('business')}`,
    `Activité : ${data.get('activity')}`,
    `Ville : ${data.get('city')}`,
    `Besoin : ${data.get('package')}`,
    `Coordonnée de réponse : ${data.get('reply')}`,
    '',
    'CE QUE JE SOUHAITE METTRE EN AVANT :',
    String(data.get('goal')).trim(),
    '',
    'Merci de me recontacter pour définir les livrables, le délai et le devis.'
  ].join('\n');

  briefPreview.textContent = currentBrief;
  briefForm.hidden = true;
  briefResult.hidden = false;
  copyStatus.textContent = '';
  briefResult.tabIndex = -1;
  briefResult.focus({ preventScroll: true });
  briefResult.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
});

async function copyBrief() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(currentBrief);
    } else {
      const helper = document.createElement('textarea');
      helper.value = currentBrief;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      if (!copied) throw new Error('copy unavailable');
    }
    copyStatus.textContent = 'Brief copié dans le presse-papiers.';
  } catch {
    copyStatus.textContent = 'La copie automatique est indisponible. Sélectionnez le texte ci-dessus pour le copier.';
  }
}

document.getElementById('copy-brief').addEventListener('click', copyBrief);

document.getElementById('download-brief').addEventListener('click', () => {
  const file = new Blob([currentBrief], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'brief-studiokapt.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  copyStatus.textContent = 'Le fichier du brief a été téléchargé.';
});

document.getElementById('edit-brief').addEventListener('click', () => {
  briefResult.hidden = true;
  briefForm.hidden = false;
  briefForm.querySelector('input').focus();
});

setupMotion();
window.addEventListener('load', () => {
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});
