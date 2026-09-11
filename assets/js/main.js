  // Header sólido sem listener contínuo de scroll.
  const header = document.getElementById('siteHeader');
  const headerSentinel = document.getElementById('headerSentinel');
  if (header && headerSentinel) {
    const headerObserver = new IntersectionObserver(([entry]) => {
      header.classList.toggle('solid', !entry.isIntersecting);
    });
    headerObserver.observe(headerSentinel);
  }

  // Mobile Nav Drawer
  const drawer = document.getElementById('navDrawer');
  const menuOpen = document.getElementById('menuOpen');
  const menuClose = document.getElementById('menuClose');
  const openDrawer = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuOpen.setAttribute('aria-expanded', 'true');
    menuClose.focus();
  };
  const closeDrawer = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    menuOpen.setAttribute('aria-expanded', 'false');
  };
  menuOpen?.addEventListener('click', openDrawer);
  menuClose?.addEventListener('click', () => {
    closeDrawer();
    menuOpen.focus();
  });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeDrawer));

  // Reveal on scroll
  // Grids/galerias grandes (muitos cards) nunca atingiam 12% de área visível
  // e ficavam com opacity:0 para sempre. Por isso movemos a classe "reveal"
  // do container para cada item individualmente, e usamos threshold baixo.
  document.querySelectorAll('#portfolioGrid .pitem, #projectGallery .gcard').forEach(el => el.classList.add('reveal'));
  document.getElementById('portfolioGrid')?.classList.remove('reveal');
  document.getElementById('projectGallery')?.classList.remove('reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.01, rootMargin:'0px 0px 0px 0px'});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Rede de segurança: se por qualquer motivo algum .reveal não for
  // observado a tempo (ex: elemento já visível no carregamento da página),
  // garante que tudo fique visível após 1.5s.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
  }, 1500);

  // Projects Carousel Controls
  const gallery = document.getElementById('projectGallery');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  if (prevBtn && nextBtn && gallery) {
    const moveGallery = direction => {
      const firstCard = gallery.querySelector('.gcard');
      const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
      const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : 360;
      gallery.scrollBy({left: direction * distance, behavior: 'smooth'});
    };

    prevBtn.addEventListener('click', () => moveGallery(-1));
    nextBtn.addEventListener('click', () => moveGallery(1));
  }

  // Scroll lateral no PC: arrastar com o mouse (click-and-drag)
  if (gallery) {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let dragMoved = false;

    gallery.addEventListener('mousedown', (e) => {
      isDown = true;
      dragMoved = false;
      gallery.classList.add('dragging');
      startX = e.pageX;
      scrollStart = gallery.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        gallery.classList.remove('dragging');
      }
    });
    gallery.addEventListener('mouseleave', () => {
      if (isDown) {
        isDown = false;
        gallery.classList.remove('dragging');
      }
    });
    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const delta = e.pageX - startX;
      if (Math.abs(delta) > 4) dragMoved = true;
      gallery.scrollLeft = scrollStart - delta;
    });
    // Evita disparar o clique/modal do card logo após um arraste
    gallery.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  // Portfolio Filter Tabs
  const filterBtns = document.querySelectorAll('#portfolioFilter .tab-btn');
  const portfolioItems = document.querySelectorAll('#portfolioGrid .pitem');

  function applyPortfolioFilter(filter, animate = false) {
    portfolioItems.forEach(item => {
      const matchesFilter = filter === 'all' || item.getAttribute('data-cat') === filter;
      item.style.display = matchesFilter ? 'block' : 'none';

      if (matchesFilter && animate) {
        item.style.opacity = '0';
        requestAnimationFrame(() => {
          item.style.opacity = '1';
          item.style.transition = 'opacity .24s cubic-bezier(.16,1,.3,1)';
        });
      }
    });
  }

  applyPortfolioFilter('all');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      applyPortfolioFilter(filter, true);
    });
  });

  // Lightbox Modal
  const modal = document.getElementById('projectModal');
  const modalImg = document.getElementById('modalImg');
  const modalTag = document.getElementById('modalTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalWaBtn = document.getElementById('modalWaBtn');
  const modalClose = document.getElementById('modalClose');
  let modalTrigger = null;

  function openModal(src, title, tag, desc) {
    modalTrigger = document.activeElement;
    modalImg.src = src;
    modalTitle.textContent = title;
    modalTag.textContent = tag;
    modalDesc.textContent = desc;

    const encodedText = encodeURIComponent(`Olá! Gostei muito deste projeto no site da P.A.P: "${title}" (${tag}). Gostaria de um orçamento personalizado para o meu espaço.`);
    modalWaBtn.href = `https://wa.me/5513991765368?text=${encodedText}`;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalTrigger instanceof HTMLElement) modalTrigger.focus();
  }

  document.querySelectorAll('[data-modal-src]').forEach(card => {
    const showProject = () => openModal(
      card.dataset.modalSrc,
      card.dataset.modalTitle,
      card.dataset.modalTag,
      card.dataset.modalDesc
    );

    card.addEventListener('click', showProject);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showProject();
      }
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
      menuOpen.focus();
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Vídeos: clique no card inicia a reprodução (controles nativos só
  // aparecem depois de dar play, pra não duplicar com o botão custom),
  // esconde o ícone de play ao tocar, e pausa os outros vídeos.
  const videoCards = document.querySelectorAll('.vcard');
  videoCards.forEach(card => {
    const vid = card.querySelector('video');
    const frame = card.querySelector('.vframe');
    if (!vid || !frame) return;
    frame.addEventListener('click', () => {
      if (vid.paused) {
        vid.controls = true;
        vid.play();
      }
    });
    vid.addEventListener('play', () => {
      card.classList.add('is-playing');
      videoCards.forEach(other => {
        const otherVid = other.querySelector('video');
        if (otherVid && otherVid !== vid && !otherVid.paused) otherVid.pause();
      });
    });
    vid.addEventListener('pause', () => card.classList.remove('is-playing'));
  });
