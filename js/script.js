// ==========================================================================
// Anything Studio — script principal
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     Datos de productos (cada uno puede tener varias imágenes -> carrusel)
  --------------------------------------------------------------------- */
  const products = [
    {
      name: 'Campera Ayendon Negra',
      type: 'Camperas',
      price: '$45.000',
      color: 'negro',
      images: ['img/products/1.jpg', 'img/products/2.jpeg', 'img/products/3.jpg', 'img/products/4.jpg'],
      desc: 'Campera con capucha de algodón peinado, cierre completo y bolsillos delanteros tipo canguro. Calce relajado unisex, doble costura reforzada. Talle L.'
    },
    {
      name: 'Campera Nike Peluche',
      type: 'Camperas',
      price: '$52.000',
      color: 'negro',
      images: ['img/products/5.jpg', 'img/products/6.jpg', 'img/products/7.jpg'],
      desc: 'Campera Nike de peluche sherpa con cierre completo y logo swoosh bordado. Súper abrigada, ideal para los días fríos. Corte oversize unisex.'
    },
    {
      name: 'Campera de Cuero Ecológico',
      type: 'Camperas',
      price: '$68.000',
      color: 'negro',
      images: ['img/products/8.jpg', 'img/products/9.jpg', 'img/products/10.jpg'],
      desc: 'Campera estilo bomber en cuero ecológico, cuello camisero, cierre metálico y puños con elastizado. Forro interior satinado. Talle L.'
    },
    {
      name: 'Jean Wide Leg Brillante',
      type: 'Pantalones',
      price: '$38.000',
      color: 'gris',
      images: ['img/products/11.jpg', 'img/products/12.jpg', 'img/products/16.jpg'],
      desc: 'Jean gris de tiro alto y pierna ancha, con aplique de strass degradé en el frente. Diseño desgastado, bolsillos delanteros y traseros. US 12.'
    },
    {
      name: 'Jean Wide Leg Estampado',
      type: 'Pantalones',
      price: '$36.000',
      color: 'gris',
      images: ['img/products/13.jpg', 'img/products/14.jpg', 'img/products/15.jpg'],
      desc: 'Jean gris de pierna ancha con estampa gráfica en la pierna trasera y bordado en el bolsillo. Cintura alta, calce relajado. Talle 40.'
    },
  ];

  let cart = [];
  let favorites = new Set();
  let currentFilter = 'Todo';
  const SWIPE_THRESHOLD = 40;

  const productGrid = document.getElementById('productGrid');
  const cartCountEl = document.getElementById('cartCount');
  const sidebarCartText = document.getElementById('sidebarCartText');
  const sidebarFavText = document.getElementById('sidebarFavText');

  /* ---------------------------------------------------------------------
     Carrusel de imágenes: helpers reutilizables (cards + modal)
  --------------------------------------------------------------------- */
  function setSlide(carouselEl, dotsEl, index) {
    const track = carouselEl.querySelector('.carousel-track');
    const total = carouselEl.querySelectorAll('.carousel-slide').length;
    if (total === 0) return;
    const max = total - 1;
    if (index < 0) index = max;
    if (index > max) index = 0;
    track.style.transform = `translateX(-${index * 100}%)`;
    carouselEl.dataset.current = index;
    if (dotsEl) {
      dotsEl.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === index));
    }
  }

  function attachSwipe(carouselEl, dotsEl) {
    let startX = 0, deltaX = 0, dragging = false;
    carouselEl.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      dragging = true;
    }, { passive: true });
    carouselEl.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });
    carouselEl.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        setSlide(carouselEl, dotsEl, (+carouselEl.dataset.current || 0) + (deltaX < 0 ? 1 : -1));
      }
      deltaX = 0;
    });
  }

  function slidesHtml(images, name) {
    return images.map(src => `<div class="carousel-slide"><img src="${src}" alt="${name}" loading="lazy"></div>`).join('');
  }

  function dotsHtml(images) {
    if (images.length <= 1) return '';
    return images.map((_, i) => `<button class="dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Ver imagen ${i + 1}"></button>`).join('');
  }

  /* ---------------------------------------------------------------------
     Render de tarjetas (cards) de producto, con carrusel interno
  --------------------------------------------------------------------- */
  function cardHtml(p) {
    const isFav = favorites.has(p.name);
    const multi = p.images.length > 1;
    return `
      <article class="product-card" data-name="${p.name}">
        <div class="product-carousel">
          <div class="carousel-track">${slidesHtml(p.images, p.name)}</div>
          ${multi ? `
          <button class="carousel-arrow prev" aria-label="Imagen anterior"><i class="fa-solid fa-chevron-left"></i></button>
          <button class="carousel-arrow next" aria-label="Imagen siguiente"><i class="fa-solid fa-chevron-right"></i></button>
          ` : ''}
          <button class="heart ${isFav ? 'active' : ''}" aria-label="Guardar ${p.name}"><i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i></button>
          <button class="quick-add" data-name="${p.name}">Agregar +</button>
        </div>
        ${multi ? `<div class="carousel-dots">${dotsHtml(p.images)}</div>` : ''}
        <div class="product-meta">
          <div><h3>${p.name}</h3><p>${p.type} / ${p.color}</p></div>
          <strong>${p.price}</strong>
        </div>
      </article>
    `;
  }

  function renderProducts(customList) {
    const list = customList || (currentFilter === 'Todo' ? products : products.filter(p => p.type === currentFilter));
    productGrid.innerHTML = list.map(cardHtml).join('');
    wireProductCards();
  }

  function wireProductCards() {
    productGrid.querySelectorAll('.product-card').forEach(card => {
      const product = products.find(p => p.name === card.dataset.name);
      if (!product) return;

      const carousel = card.querySelector('.product-carousel');
      const dots = card.querySelector('.carousel-dots');
      carousel.dataset.current = '0';

      // Flechas izquierda / derecha
      const prevBtn = carousel.querySelector('.carousel-arrow.prev');
      const nextBtn = carousel.querySelector('.carousel-arrow.next');
      if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSlide(carousel, dots, (+carousel.dataset.current) - 1);
      });
      if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSlide(carousel, dots, (+carousel.dataset.current) + 1);
      });

      // Indicadores (dots)
      if (dots) {
        dots.querySelectorAll('.dot').forEach(dot => {
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            setSlide(carousel, dots, +dot.dataset.idx);
          });
        });
      }

      // Swipe en mobile
      attachSwipe(carousel, dots);

      // Favoritos
      const heart = card.querySelector('.heart');
      heart.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(product.name);
        syncHeartIcon(heart, favorites.has(product.name));
      });

      // Agregar al carrito rápido
      const addBtn = card.querySelector('.quick-add');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product.name);
      });

      // Click en la card (fuera de controles) -> abrir modal agrandado
      card.addEventListener('click', (e) => {
        if (e.target.closest('.carousel-arrow, .dot, .heart, .quick-add')) return;
        openProductModal(product, +carousel.dataset.current || 0);
      });
    });
  }

  function syncHeartIcon(el, isFav) {
    el.classList.toggle('active', isFav);
    const icon = el.querySelector('i');
    icon.classList.toggle('fa-regular', !isFav);
    icon.classList.toggle('fa-solid', isFav);
  }

  /* ---------------------------------------------------------------------
     Favoritos
  --------------------------------------------------------------------- */
  function toggleFavorite(name) {
    if (favorites.has(name)) favorites.delete(name); else favorites.add(name);
    renderFavoritesSidebar();
  }

  function renderFavoritesSidebar() {
    if (!sidebarFavText) return;
    if (favorites.size === 0) {
      sidebarFavText.textContent = 'Todavía no guardaste productos.';
      return;
    }
    sidebarFavText.innerHTML = `<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px;">
      ${[...favorites].map(n => `<li style="color:white; font-size:13px;">${n}</li>`).join('')}
    </ul>`;
  }

  /* ---------------------------------------------------------------------
     Modal de producto (imagen agrandada + carrusel + acciones)
  --------------------------------------------------------------------- */
  const productModal = document.getElementById('productModal');
  const modalCarousel = document.getElementById('modalCarousel');
  const modalTrack = document.getElementById('modalTrack');
  const modalDots = document.getElementById('modalDots');
  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');
  const modalFavBtn = document.getElementById('modalFavBtn');

  function openProductModal(product, startIndex) {
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalInfo').textContent = `${product.type} / ${product.color}`;
    document.getElementById('modalDescription').textContent = product.desc;
    document.getElementById('modalPrice').textContent = product.price;

    modalTrack.innerHTML = slidesHtml(product.images, product.name);
    modalDots.innerHTML = dotsHtml(product.images);
    const multi = product.images.length > 1;
    modalPrev.hidden = !multi;
    modalNext.hidden = !multi;

    modalDots.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', () => setSlide(modalCarousel, modalDots, +dot.dataset.idx));
    });

    setSlide(modalCarousel, modalDots, startIndex || 0);
    syncHeartIcon(modalFavBtn, favorites.has(product.name));

    modalFavBtn.onclick = () => {
      toggleFavorite(product.name);
      syncHeartIcon(modalFavBtn, favorites.has(product.name));
      productGrid.querySelectorAll('.product-card').forEach(card => {
        if (card.dataset.name === product.name) syncHeartIcon(card.querySelector('.heart'), favorites.has(product.name));
      });
    };

    productModal.querySelector('.modal-add-btn').onclick = () => addToCart(product.name);

    productModal.hidden = false;
  }

  modalPrev.addEventListener('click', () => setSlide(modalCarousel, modalDots, (+modalCarousel.dataset.current || 0) - 1));
  modalNext.addEventListener('click', () => setSlide(modalCarousel, modalDots, (+modalCarousel.dataset.current || 0) + 1));
  attachSwipe(modalCarousel, modalDots);

  document.addEventListener('keydown', (e) => {
    if (productModal.hidden) return;
    if (e.key === 'Escape') productModal.hidden = true;
    if (e.key === 'ArrowLeft') setSlide(modalCarousel, modalDots, (+modalCarousel.dataset.current || 0) - 1);
    if (e.key === 'ArrowRight') setSlide(modalCarousel, modalDots, (+modalCarousel.dataset.current || 0) + 1);
  });

  // Cerrar modal
  productModal.querySelector('.modal-overlay').addEventListener('click', () => productModal.hidden = true);
  productModal.querySelector('.modal-close').addEventListener('click', () => productModal.hidden = true);


  /* -------------------------------------------------------------------
     Funcionalidad JS #1: Filtrado de productos por categoría
  ------------------------------------------------------------------- */
  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
  });

  /* -------------------------------------------------------------------
     Funcionalidad JS #2: Carrito de compras (contador dinámico)
  ------------------------------------------------------------------- */
  function addToCart(name) {
    const product = products.find(p => p.name === name);
    cart.push(product);
    
    cartCountEl.textContent = cart.length;
    renderCartSidebar();
  }

  function renderCartSidebar() {
    if (cart.length === 0) {
      sidebarCartText.innerHTML = 'Todavía no agregaste productos.';
      return;
    }

    let total = 0;
    let html = `<ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px;">`;

    cart.forEach((item, index) => {
      const price = parseInt(item.price.replace(/[^0-9]/g, ''), 10);
      total += price;
      html += `
        <li style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #333;">
          <div>
            <div style="font-size:14px; font-weight:500; color: white;">${item.name}</div>
            <div style="font-size:12px; color: #999;">${item.color} · ${item.type}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size:15px; color: white; font-weight:600;">${item.price}</span>
            <button class="cart-remove-btn" data-index="${index}" style="background: none; border: none; color: #888; cursor: pointer; font-size: 14px;"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </li>
      `;
    });

    html += `</ul>`;
    html += `
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #444;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: white;">Total</strong>
          <strong style="color: white; font-size: 20px;">$${total.toLocaleString('es-AR')}</strong>
        </div>
      </div>
      <button class="dark-button light checkout-open-btn" id="goToCheckoutBtn">Finalizar compra <span><i class="fa-solid fa-arrow-up-right"></i></span></button>
    `;

    sidebarCartText.innerHTML = html;

    // Asignar eventos de borrar a los botones
    sidebarCartText.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        removeFromCart(index);
      });
    });

    // Botón para ir al checkout
    const goToCheckoutBtn = sidebarCartText.querySelector('#goToCheckoutBtn');
    if (goToCheckoutBtn) goToCheckoutBtn.addEventListener('click', openCheckout);
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    cartCountEl.textContent = cart.length;
    renderCartSidebar();
  }
  document.getElementById('cartBtn').addEventListener('click', () => openSidebar());

  /* -------------------------------------------------------------------
     Funcionalidad JS #9: Checkout con pasarela de pago (demostración
     estética — no valida contra ninguna API real).
  ------------------------------------------------------------------- */
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutOrderView = document.getElementById('checkoutOrderView');
  const checkoutSuccessView = document.getElementById('checkoutSuccessView');
  const checkoutItemsEl = document.getElementById('checkoutItems');
  const checkoutTotalEl = document.getElementById('checkoutTotal');
  const checkoutPayTotalEl = document.getElementById('checkoutPayTotal');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutPayBtn = document.getElementById('checkoutPayBtn');
  const cardNumberInput = document.getElementById('ckCardNumber');
  const cardBrandIcon = document.getElementById('cardBrandIcon');
  const expiryInput = document.getElementById('ckExpiry');
  const cvvInput = document.getElementById('ckCvv');

  function cartTotal() {
    return cart.reduce((sum, item) => sum + parseInt(item.price.replace(/[^0-9]/g, ''), 10), 0);
  }

  function openCheckout() {
    if (cart.length === 0) return;

    checkoutItemsEl.innerHTML = cart.map(item => `
      <li>
        <img src="${item.images[0]}" alt="${item.name}">
        <div class="checkout-item-info">
          <span class="checkout-item-name">${item.name}</span>
          <span class="checkout-item-meta">${item.type} · ${item.color}</span>
        </div>
        <strong>${item.price}</strong>
      </li>
    `).join('');

    const total = cartTotal();
    checkoutTotalEl.textContent = `$${total.toLocaleString('es-AR')}`;
    checkoutPayTotalEl.textContent = `$${total.toLocaleString('es-AR')}`;

    checkoutOrderView.hidden = false;
    checkoutSuccessView.hidden = true;
    checkoutPayBtn.classList.remove('loading');
    checkoutPayBtn.disabled = false;
    checkoutModal.hidden = false;
    closeSidebar();
  }

  function closeCheckout() {
    checkoutModal.hidden = true;
  }

  document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
  checkoutModal.querySelector('.modal-overlay').addEventListener('click', closeCheckout);
  document.getElementById('checkoutContinueBtn').addEventListener('click', closeCheckout);

  document.addEventListener('keydown', (e) => {
    if (!checkoutModal.hidden && e.key === 'Escape') closeCheckout();
  });

  // Formateo en vivo del número de tarjeta + detección visual de marca
  cardNumberInput.addEventListener('input', () => {
    const digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
    cardNumberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();

    let brand = null;
    if (/^4/.test(digits)) brand = 'visa';
    else if (/^5[1-5]/.test(digits)) brand = 'mastercard';
    else if (/^3[47]/.test(digits)) brand = 'amex';

    if (brand) {
      cardBrandIcon.className = `fa-brands fa-cc-${brand} card-brand-icon`;
      cardBrandIcon.hidden = false;
    } else {
      cardBrandIcon.hidden = true;
    }
  });

  // Formateo en vivo del vencimiento (MM/AA)
  expiryInput.addEventListener('input', () => {
    const digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
    expiryInput.value = digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });

  // Solo números en el CVV
  cvvInput.addEventListener('input', () => {
    cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4);
  });

  function setCkError(fieldId, message) {
    const row = document.getElementById(fieldId).closest('.form-row');
    const errorEl = document.getElementById('err-' + fieldId);
    row.classList.toggle('invalid', Boolean(message));
    errorEl.textContent = message || '';
  }

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('ckName').value.trim();
    const email = document.getElementById('ckEmail').value.trim();
    const address = document.getElementById('ckAddress').value.trim();
    const city = document.getElementById('ckCity').value.trim();
    const cardNumber = cardNumberInput.value.replace(/\s/g, '');
    const cardName = document.getElementById('ckCardName').value.trim();
    const expiry = expiryInput.value.trim();
    const cvv = cvvInput.value.trim();

    if (name.length < 3) { setCkError('ckName', 'Ingresá tu nombre completo.'); valid = false; } else setCkError('ckName');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) { setCkError('ckEmail', 'Ingresá un email válido.'); valid = false; } else setCkError('ckEmail');

    if (address.length < 5) { setCkError('ckAddress', 'Ingresá tu dirección.'); valid = false; } else setCkError('ckAddress');
    if (city.length < 2) { setCkError('ckCity', 'Ingresá tu ciudad.'); valid = false; } else setCkError('ckCity');

    if (cardNumber.length !== 16) { setCkError('ckCardNumber', 'El número debe tener 16 dígitos.'); valid = false; } else setCkError('ckCardNumber');
    if (cardName.length < 3) { setCkError('ckCardName', 'Ingresá el titular de la tarjeta.'); valid = false; } else setCkError('ckCardName');

    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      setCkError('ckExpiry', 'Formato MM/AA.'); valid = false;
    } else {
      const month = parseInt(expiryMatch[1], 10);
      const year = parseInt(expiryMatch[2], 10) + 2000;
      const expDate = new Date(year, month, 0);
      if (month < 1 || month > 12) { setCkError('ckExpiry', 'Mes inválido.'); valid = false; }
      else if (expDate < new Date()) { setCkError('ckExpiry', 'Tarjeta vencida.'); valid = false; }
      else setCkError('ckExpiry');
    }

    if (cvv.length < 3) { setCkError('ckCvv', 'CVV inválido.'); valid = false; } else setCkError('ckCvv');

    if (!valid) return;

    // Simulación visual de "procesando pago" (sin ninguna llamada real a una API)
    checkoutPayBtn.classList.add('loading');
    checkoutPayBtn.disabled = true;

    setTimeout(() => {
      const orderNumber = '#AS-' + Math.floor(10000 + Math.random() * 89999);
      document.getElementById('successOrderNumber').textContent = orderNumber;
      document.getElementById('successEmail').textContent = email;

      checkoutOrderView.hidden = true;
      checkoutSuccessView.hidden = false;

      // Vaciar el carrito tras la "compra" exitosa
      cart = [];
      cartCountEl.textContent = cart.length;
      renderCartSidebar();

      checkoutForm.reset();
      cardBrandIcon.hidden = true;
    }, 1400);
  });

  /* -------------------------------------------------------------------
     Funcionalidad Buscador Lupa
  ------------------------------------------------------------------- */
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  searchBtn.addEventListener('click', () => {
    searchInput.hidden = !searchInput.hidden;
    if (!searchInput.hidden) {
      searchInput.focus();
      searchInput.value = '';
      currentFilter = 'Todo';
      document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
      document.querySelector('#filters button[data-filter="Todo"]').classList.add('active');
      renderProducts();
    }
  });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    let filtered = products;

    if (query) {
      filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query) ||
        p.color.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query)
      );
    }

    renderProducts(filtered);
  });

  // Cerrar buscador al dar enter o hacer click afuera
  document.addEventListener('click', (e) => {
    if (!searchBtn.contains(e.target) && !searchInput.contains(e.target)) {
      searchInput.hidden = true;
    }
  });

  /* -------------------------------------------------------------------
     Funcionalidad JS #3: Menú hamburguesa (mostrar/ocultar) en mobile
  ------------------------------------------------------------------- */
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  /* -------------------------------------------------------------------
     Funcionalidad JS #4: Sidebar deslizable (abrir / cerrar)
  ------------------------------------------------------------------- */
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
    sidebarToggle.setAttribute('aria-expanded', 'true');
    renderCartSidebar(); // Actualizar el carrito siempre que se abre
    renderFavoritesSidebar(); // Actualizar favoritos siempre que se abre
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  }
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Links de categorías dentro del sidebar también filtran productos
  document.querySelectorAll('.sidebar-links a').forEach(link => {
    link.addEventListener('click', () => {
      currentFilter = link.dataset.cat;
      document.querySelectorAll('#filters button').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === currentFilter);
      });
      renderProducts();
      closeSidebar();
    });
  });

  /* -------------------------------------------------------------------
     Funcionalidad JS #5: Collapsible — Preguntas frecuentes
  ------------------------------------------------------------------- */
  document.querySelectorAll('.faq-item button').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* -------------------------------------------------------------------
     Funcionalidad JS #6: Control de video (play / pause personalizado)
  ------------------------------------------------------------------- */
  const lookVideo = document.getElementById('lookVideo');
  const playPauseBtn = document.getElementById('playPauseBtn');
  playPauseBtn.addEventListener('click', () => {
    if (lookVideo.paused) {
      lookVideo.play();
      playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
    } else {
      lookVideo.pause();
      playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir';
    }
  });

  /* -------------------------------------------------------------------
     Funcionalidad JS #7: Control de audio ambiente (play / pause)
  ------------------------------------------------------------------- */
  const ambientAudio = document.getElementById('ambientAudio');
  const audioToggle = document.getElementById('audioToggle');
  const audioStatus = document.getElementById('audioStatus');
  audioToggle.addEventListener('click', () => {
    if (ambientAudio.paused) {
      ambientAudio.play();
      audioToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
      audioStatus.textContent = 'Reproduciendo';
    } else {
      ambientAudio.pause();
      audioToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
      audioStatus.textContent = 'Pausado';
    }
  });

  /* -------------------------------------------------------------------
     Funcionalidad JS #8: Validación del formulario de contacto
  ------------------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  function setError(fieldId, message) {
    const row = document.getElementById(fieldId).closest('.form-row');
    const errorEl = document.getElementById('err-' + fieldId);
    if (message) {
      row.classList.add('invalid');
      errorEl.textContent = message;
    } else {
      row.classList.remove('invalid');
      errorEl.textContent = '';
    }
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formSuccess.hidden = true;
    let valid = true;

    const fullname = document.getElementById('fullname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const comments = document.getElementById('comments').value.trim();

    if (fullname.length < 3) {
      setError('fullname', 'Ingresá tu nombre y apellido completos.');
      valid = false;
    } else {
      setError('fullname', '');
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setError('phone', 'Ingresá un teléfono válido (mínimo 8 dígitos).');
      valid = false;
    } else {
      setError('phone', '');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('email', 'Ingresá un email válido.');
      valid = false;
    } else {
      setError('email', '');
    }

    if (comments.length < 5) {
      setError('comments', 'Contanos un poco más en tu comentario.');
      valid = false;
    } else {
      setError('comments', '');
    }

    if (!valid) {
      return;
    }

    formSuccess.hidden = false;
    contactForm.reset();
  });

  // Primer render de productos
  renderProducts();
});
