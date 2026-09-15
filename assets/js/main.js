const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const EASE_OUT = 'cubic-bezier(.23, 1, .32, 1)';

// Header sólido sem listener contínuo de scroll.
const header = document.getElementById('siteHeader');
const headerSentinel = document.getElementById('headerSentinel');
if (header && headerSentinel) {
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('solid', !entry.isIntersecting);
  }).observe(headerSentinel);
}

// Menu mobile: inert quando fechado, para o teclado não cair em links invisíveis.
const drawer = document.getElementById('navDrawer');
const menuOpen = document.getElementById('menuOpen');
const menuClose = document.getElementById('menuClose');
drawer.inert = true;

const openDrawer = () => {
  drawer.inert = false;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  menuOpen.setAttribute('aria-expanded', 'true');
  root.classList.add('is-locked');
  menuClose.focus();
};
const closeDrawer = ({ restoreFocus = false } = {}) => {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.inert = true;
  menuOpen.setAttribute('aria-expanded', 'false');
  root.classList.remove('is-locked');
  if (restoreFocus) menuOpen.focus();
};
menuOpen.addEventListener('click', openDrawer);
menuClose.addEventListener('click', () => closeDrawer({ restoreFocus: true }));
drawer.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => closeDrawer()));

// Reveal: seções entram uma vez; itens de grade entram em cascata curta,
// calculada por lote de interseção (e não pelo índice na página inteira).
const revealTargets = [
  ...document.querySelectorAll('.reveal'),
  ...document.querySelectorAll('[data-stagger] > *'),
];
const showAll = () => revealTargets.forEach(el => el.classList.add('is-visible'));

if (!('IntersectionObserver' in window) || reduceMotion.matches) {
  showAll();
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries
      .filter(entry => entry.isIntersecting)
      .forEach((entry, i) => {
        entry.target.style.setProperty('--d', `${Math.min(i, 6) * 60}ms`);
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
}

// Destaques: setas + arrastar com o mouse
const gallery = document.getElementById('projectGallery');
const prevBtn = document.getElementById('galleryPrev');
const nextBtn = document.getElementById('galleryNext');

if (gallery) {
  const cards = gallery.querySelectorAll('.gcard');
  gallery.querySelectorAll('img').forEach(img => { img.draggable = false; });

  const step = direction => {
    const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
    const distance = cards[0].getBoundingClientRect().width + gap;
    gallery.scrollBy({ left: direction * distance, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  };
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  // Desabilita as setas nas pontas observando o primeiro e o último card.
  const edgeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const btn = entry.target === cards[0] ? prevBtn : nextBtn;
      if (btn) btn.disabled = entry.intersectionRatio > 0.9;
    });
  }, { root: gallery, threshold: [0, 0.9, 1] });
  edgeObserver.observe(cards[0]);
  edgeObserver.observe(cards[cards.length - 1]);

  let pointerId = null;
  let startX = 0;
  let scrollStart = 0;
  let dragMoved = false;

  gallery.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pointerId = e.pointerId;
    dragMoved = false;
    startX = e.clientX;
    scrollStart = gallery.scrollLeft;
  });
  gallery.addEventListener('pointermove', e => {
    if (e.pointerId !== pointerId) return;
    const delta = e.clientX - startX;
    if (!dragMoved && Math.abs(delta) > 5) {
      dragMoved = true;
      gallery.setPointerCapture(pointerId);
      gallery.classList.add('dragging');
    }
    if (dragMoved) gallery.scrollLeft = scrollStart - delta;
  });
  const endDrag = e => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    gallery.classList.remove('dragging');
  };
  gallery.addEventListener('pointerup', endDrag);
  gallery.addEventListener('pointercancel', endDrag);
  // Um arraste não deve abrir o projeto ao soltar.
  gallery.addEventListener('click', e => {
    if (dragMoved) {
      e.preventDefault();
      e.stopPropagation();
      dragMoved = false;
    }
  }, true);
}

// Portfólio: filtros + "ver todos" na seleção inicial
const filterBtns = document.querySelectorAll('#portfolioFilter .tab-btn');
const portfolioItems = [...document.querySelectorAll('#portfolioGrid .pitem')];
const moreBtn = document.getElementById('portfolioMore');
// Linhas completas: 3 colunas no desktop, 2 no celular.
const INITIAL_COUNT = window.matchMedia('(min-width: 960px)').matches ? 9 : 8;
let currentFilter = 'all';
let expanded = false;

const enter = (items) => {
  if (reduceMotion.matches) return;
  items.forEach((item, i) => {
    item.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 420, delay: Math.min(i, 8) * 35, easing: EASE_OUT, fill: 'backwards' }
    );
  });
};

function applyPortfolioFilter({ animate = false } = {}) {
  const shown = [];
  let matchCount = 0;
  portfolioItems.forEach(item => {
    const matches = currentFilter === 'all' || item.dataset.cat === currentFilter;
    const withinLimit = currentFilter !== 'all' || expanded || matchCount < INITIAL_COUNT;
    if (matches) matchCount++;
    const visible = matches && withinLimit;
    const wasHidden = item.hidden;
    item.hidden = !visible;
    item.classList.add('is-visible');
    if (visible && (wasHidden || animate)) shown.push(item);
  });
  if (moreBtn) moreBtn.hidden = currentFilter !== 'all' || expanded;
  return shown;
}

applyPortfolioFilter();
// Os itens fora do limite inicial não passam pelo reveal; entram pelo filtro.
portfolioItems.forEach(item => { if (!item.hidden) item.classList.remove('is-visible'); });

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.filter === currentFilter) return;
    filterBtns.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    currentFilter = btn.dataset.filter;
    enter(applyPortfolioFilter({ animate: true }));
  });
});

moreBtn?.addEventListener('click', () => {
  expanded = true;
  const shown = applyPortfolioFilter();
  enter(shown);
  shown[0]?.focus({ preventScroll: true });
});

// Lightbox
const modal = document.getElementById('projectModal');
const modalImg = document.getElementById('modalImg');
const modalImgWrap = modal.querySelector('.modal-img-wrap');
const modalTag = document.getElementById('modalTag');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalWaBtn = document.getElementById('modalWaBtn');
const modalClose = document.getElementById('modalClose');
let modalTrigger = null;
modal.inert = true;

function openModal({ modalSrc, modalTitle: title, modalTag: tag, modalDesc: desc }, alt) {
  modalTrigger = document.activeElement;
  modalImgWrap.classList.add('is-loading');
  modalImg.onload = () => modalImgWrap.classList.remove('is-loading');
  modalImg.src = modalSrc;
  modalImg.alt = alt || title;
  modalTitle.textContent = title;
  modalTag.textContent = tag;
  modalDesc.textContent = desc;

  const text = encodeURIComponent(`Olá! Gostei deste projeto no site da P.A.P: "${title}" (${tag}). Gostaria de um orçamento para o meu espaço.`);
  modalWaBtn.href = `https://wa.me/5513991765368?text=${text}`;

  modal.inert = false;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  root.classList.add('is-locked');
  modalClose.focus({ preventScroll: true });
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modal.inert = true;
  root.classList.remove('is-locked');
  if (modalTrigger instanceof HTMLElement) modalTrigger.focus({ preventScroll: true });
}

document.querySelectorAll('[data-modal-src]').forEach(card => {
  const show = () => openModal(card.dataset, card.querySelector('img')?.alt);
  card.addEventListener('click', show);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      show();
    }
  });
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// Mantém o foco dentro do diálogo aberto.
modal.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusable = [...modal.querySelectorAll('button, a[href]')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (modal.classList.contains('open')) closeModal();
  else if (drawer.classList.contains('open')) closeDrawer({ restoreFocus: true });
});

// Segmentos: a lista troca a imagem de destaque no desktop.
const segRows = document.querySelectorAll('.seg-row');
const segImgs = document.querySelectorAll('.seg-preview img');
const setSegment = index => {
  segRows.forEach((row, i) => row.classList.toggle('is-active', i === index));
  segImgs.forEach((img, i) => img.classList.toggle('is-active', i === index));
};
segRows.forEach((row, i) => {
  row.addEventListener('pointerenter', () => { if (finePointer.matches) setSegment(i); });
  row.addEventListener('focus', () => setSegment(i));
});

// Vídeos: o card inteiro inicia a reprodução; controles nativos só depois do play.
const videoCards = document.querySelectorAll('.vcard');
videoCards.forEach(card => {
  const vid = card.querySelector('video');
  const frame = card.querySelector('.vframe');
  if (!vid || !frame) return;

  const label = card.querySelector('h3')?.textContent.trim();
  frame.tabIndex = 0;
  frame.setAttribute('role', 'button');
  frame.setAttribute('aria-label', `Reproduzir vídeo: ${label}`);

  const play = () => {
    if (!vid.paused) return;
    vid.controls = true;
    vid.play();
    frame.removeAttribute('role');
    frame.removeAttribute('aria-label');
    frame.tabIndex = -1;
    vid.focus({ preventScroll: true });
  };
  frame.addEventListener('click', play);
  frame.addEventListener('keydown', e => {
    if (e.target === frame && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      play();
    }
  });
  vid.addEventListener('play', () => {
    card.classList.add('is-playing');
    videoCards.forEach(other => {
      const otherVid = other.querySelector('video');
      if (otherVid !== vid && !otherVid.paused) otherVid.pause();
    });
  });
  vid.addEventListener('pause', () => card.classList.remove('is-playing'));
});
