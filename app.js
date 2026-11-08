/**
 * AURA LUXE STORE APPLICATION ENGINE
 * Handles: SPA Routing, Cart Management, Multi-Currency, Filter & Search,
 * Modals, Acrylic Micro-interactions, Toast Notifications, and Social Feeds.
 */

// Application State
const AppState = {
  currentRoute: 'home',
  currency: 'USD',
  currencySymbols: { USD: '$', EUR: '€', GBP: '£' },
  currencyRates: { USD: 1.0, EUR: 0.92, GBP: 0.79 },
  cart: [],
  wishlist: new Set(),
  activeCategory: 'all',
  searchQuery: '',
  appliedPromo: null,
  activeQuickViewProduct: null,
  isThemeLight: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initRouting();
  initCurrency();
  initThemeToggle();
  renderAllViews();
  initCartEvents();
  initModals();
  initContactForm();
  initFAQ();
  initBestsellerCountdown();
});

// Load persistent data from LocalStorage
function initStorage() {
  try {
    const savedCart = localStorage.getItem('aura_cart');
    if (savedCart) AppState.cart = JSON.parse(savedCart);

    const savedWishlist = localStorage.getItem('aura_wishlist');
    if (savedWishlist) AppState.wishlist = new Set(JSON.parse(savedWishlist));

    const savedCurrency = localStorage.getItem('aura_currency');
    if (savedCurrency && AppState.currencyRates[savedCurrency]) {
      AppState.currency = savedCurrency;
      const select = document.getElementById('currency-select');
      if (select) select.value = savedCurrency;
    }

    const savedTheme = localStorage.getItem('aura_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      AppState.isThemeLight = true;
    }
  } catch (e) {
    console.warn('Storage initialization fallback', e);
  }
  updateCartBadge();
  updateWishlistBadge();
}

function saveCart() {
  try {
    localStorage.setItem('aura_cart', JSON.stringify(AppState.cart));
  } catch (e) {}
}

function saveWishlist() {
  try {
    localStorage.setItem('aura_wishlist', JSON.stringify(Array.from(AppState.wishlist)));
  } catch (e) {}
}

// Format Price according to selected Currency
function formatPrice(amountInUSD) {
  const rate = AppState.currencyRates[AppState.currency] || 1.0;
  const symbol = AppState.currencySymbols[AppState.currency] || '$';
  const converted = Math.round(amountInUSD * rate);
  return `${symbol}${converted.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// ROUTING & NAVIGATION
// ---------------------------------------------------------------------------
function initRouting() {
  const handleHashChange = () => {
    const hash = window.location.hash.replace('#', '').trim() || 'home';
    const validRoutes = ['home', 'categories', 'bestsellers', 'contact', 'social'];
    const target = validRoutes.includes(hash) ? hash : 'home';
    switchPage(target);
  };

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }
}

function switchPage(pageId) {
  AppState.currentRoute = pageId;

  // Toggle page visibility
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active-view');
  });

  const activeElement = document.getElementById(`view-${pageId}`);
  if (activeElement) {
    activeElement.classList.add('active-view');
  }

  // Update active state in nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-route') === pageId);
  });

  // Close mobile drawer if open
  const navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.remove('mobile-open');

  // Smooth scroll to top of window
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------------------------------
// CURRENCY & THEME
// ---------------------------------------------------------------------------
function initCurrency() {
  const select = document.getElementById('currency-select');
  if (!select) return;

  select.addEventListener('change', (e) => {
    AppState.currency = e.target.value;
    try { localStorage.setItem('aura_currency', AppState.currency); } catch (err) {}
    renderAllViews();
    renderCart();
    showToast(`Currency converted to ${AppState.currency}`, 'info');
  });
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    AppState.isThemeLight = !AppState.isThemeLight;
    document.body.classList.toggle('light-theme', AppState.isThemeLight);
    try {
      localStorage.setItem('aura_theme', AppState.isThemeLight ? 'light' : 'dark');
    } catch (e) {}

    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = AppState.isThemeLight ? 'fas fa-sun' : 'fas fa-moon';
    }
    showToast(AppState.isThemeLight ? 'Pearl Light Aesthetic Active' : 'Obsidian Dark Aesthetic Active');
  });
}

// ---------------------------------------------------------------------------
// VIEW RENDERERS
// ---------------------------------------------------------------------------
function renderAllViews() {
  renderHomeFeatured();
  renderCategoriesView();
  renderBestSellersView();
  renderSocialView();
}

// 1. HOME VIEW
function renderHomeFeatured() {
  const container = document.getElementById('home-featured-grid');
  if (!container) return;

  // Grab curated top 4 products
  const featured = PRODUCTS_DATA.slice(0, 4);
  container.innerHTML = featured.map(p => createProductCardHtml(p)).join('');
  attachProductCardEvents(container);
}

// 2. CATEGORIES VIEW
function renderCategoriesView() {
  const container = document.getElementById('categories-product-grid');
  if (!container) return;

  let filtered = PRODUCTS_DATA;
  if (AppState.activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category === AppState.activeCategory);
  }

  if (AppState.searchQuery.trim() !== '') {
    const q = AppState.searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q)
    );
  }

  // Handle Sort
  const sortSelect = document.getElementById('category-sort-select');
  if (sortSelect) {
    const val = sortSelect.value;
    if (val === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (val === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else if (val === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <i class="fas fa-search" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h3 style="font-size: 1.3rem; margin-bottom: 8px;">No creations found</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Try adjusting your search query or category filter.</p>
        <button class="btn-acrylic btn-acrylic-gold" onclick="resetCategoryFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => createProductCardHtml(p)).join('');
  attachProductCardEvents(container);
}

window.resetCategoryFilters = function() {
  AppState.activeCategory = 'all';
  AppState.searchQuery = '';
  const searchInput = document.getElementById('category-search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.category-chip').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-category') === 'all');
  });
  renderCategoriesView();
};

// 3. BEST SELLERS VIEW
function renderBestSellersView() {
  const container = document.getElementById('bestsellers-grid');
  if (!container) return;

  const bestSellers = PRODUCTS_DATA.filter(p => p.isBestSeller).sort((a, b) => a.bestSellerRank - b.bestSellerRank);
  container.innerHTML = bestSellers.map(p => createProductCardHtml(p, true)).join('');
  attachProductCardEvents(container);
}

// 4. SOCIAL MEDIA VIEW
function renderSocialView() {
  const container = document.getElementById('social-feed-grid');
  if (!container) return;

  container.innerHTML = SOCIAL_POSTS.map(post => `
    <div class="social-feed-card">
      <div class="social-img-wrap">
        <img src="${post.image}" alt="${post.handle}" loading="lazy" />
        <div class="social-hover-overlay">
          <div style="display: flex; gap: 20px; font-weight: 700; color: #FFF; font-size: 1.1rem;">
            <span><i class="fas fa-heart" style="color: #EF4444; margin-right: 6px;"></i>${post.likes}</span>
            <span><i class="fas fa-comment" style="color: var(--accent-gold); margin-right: 6px;"></i>${post.comments}</span>
          </div>
          <button class="btn-acrylic btn-acrylic-gold btn-acrylic-sm" onclick="openQuickViewById('${post.tagId}')">
            <i class="fas fa-tag"></i> Shop Tagged Item
          </button>
        </div>
      </div>
      <div class="social-card-body">
        <div class="social-card-user">
          <span class="social-handle"><i class="fab fa-instagram" style="margin-right: 6px;"></i>${post.handle}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${post.user}</span>
        </div>
        <p class="social-caption">${post.caption}</p>
      </div>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------------
// PRODUCT CARD COMPONENT
// ---------------------------------------------------------------------------
function createProductCardHtml(product, isBestsellerView = false) {
  const isWish = AppState.wishlist.has(product.id);
  const rankBadge = isBestsellerView && product.bestSellerRank 
    ? `<span class="product-badge-pill" style="border-color: var(--accent-gold); color: #FFF; background: rgba(229, 184, 105, 0.25);">Rank #${product.bestSellerRank}</span>`
    : (product.badge ? `<span class="product-badge-pill">${product.badge}</span>` : '');

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-thumb-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
        ${rankBadge}
        <button class="product-wishlist-btn ${isWish ? 'active' : ''}" data-wishlist-id="${product.id}" title="Save to Wishlist">
          <i class="${isWish ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
      <div class="product-category-lbl">${product.categoryLabel}</div>
      <h3 class="product-title">${product.name}</h3>
      <div class="product-rating">
        <span class="stars">${'★'.repeat(Math.floor(product.rating))}</span>
        <span>${product.rating.toFixed(1)} (${product.reviewsCount})</span>
        ${product.stockCount <= 5 ? `<span style="margin-left: auto; color: #F87171; font-weight: 600; font-size: 0.78rem;"><i class="fas fa-fire"></i> Only ${product.stockCount} left</span>` : ''}
      </div>
      <div class="product-price-bar">
        <span class="current-price">${formatPrice(product.price)}</span>
        <span class="original-price">${formatPrice(product.originalPrice)}</span>
      </div>
      ${isBestsellerView ? `
        <div class="stock-progress-bar">
          <div class="stock-fill" style="width: ${Math.max(15, 100 - (product.stockCount * 12))}%;"></div>
        </div>
      ` : ''}
      <div class="product-actions">
        <button class="btn-acrylic btn-acrylic-gold add-to-cart-btn" data-id="${product.id}">
          <i class="fas fa-shopping-bag"></i> Add to Bag
        </button>
        <button class="btn-acrylic btn-acrylic-icon quick-view-btn" data-id="${product.id}" title="Quick View">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    </div>
  `;
}

function attachProductCardEvents(container) {
  // Add to cart click
  container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      addToCart(id, 1);
    });
  });

  // Quick view click
  container.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      openQuickViewById(id);
    });
  });

  // Wishlist toggle
  container.querySelectorAll('.product-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-wishlist-id');
      toggleWishlist(id);
    });
  });
}

// ---------------------------------------------------------------------------
// SHOPPING CART SYSTEM
// ---------------------------------------------------------------------------
function initCartEvents() {
  const cartToggle = document.getElementById('cart-toggle-btn');
  const cartClose = document.getElementById('cart-close-btn');
  const cartOverlay = document.getElementById('cart-overlay');
  const checkoutBtn = document.getElementById('cart-checkout-btn');
  const applyPromoBtn = document.getElementById('apply-promo-btn');

  if (cartToggle && cartOverlay) {
    cartToggle.addEventListener('click', () => openCart());
  }

  if (cartClose && cartOverlay) {
    cartClose.addEventListener('click', () => closeCart());
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (AppState.cart.length === 0) {
        showToast('Your bag is empty! Add a creation first.', 'warning');
        return;
      }
      closeCart();
      openCheckoutModal();
    });
  }

  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', () => {
      const input = document.getElementById('promo-code-input');
      if (!input) return;
      const code = input.value.trim().toUpperCase();

      if (code === 'AURA10') {
        AppState.appliedPromo = { code: 'AURA10', discountPercent: 0.10, label: '10% Privileged Savings' };
        showToast('Code AURA10 Applied: 10% Off!', 'success');
      } else if (code === 'LUMINA20') {
        AppState.appliedPromo = { code: 'LUMINA20', discountPercent: 0.20, label: '20% Atelier VIP Pass' };
        showToast('Code LUMINA20 Applied: 20% Off!', 'success');
      } else if (code === 'FREESHIP') {
        AppState.appliedPromo = { code: 'FREESHIP', discountPercent: 0, freeShipping: true, label: 'Complimentary White-Glove Shipping' };
        showToast('Code FREESHIP Applied: Free Courier Delivery!', 'success');
      } else {
        showToast('Invalid promo code. Try AURA10 or LUMINA20', 'error');
        return;
      }
      renderCart();
    });
  }
}

function openCart() {
  renderCart();
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.classList.add('open');
}

function closeCart() {
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.classList.remove('open');
}

function addToCart(productId, quantity = 1) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const existing = AppState.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    AppState.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  saveCart();
  updateCartBadge();
  showToast(`Added "${product.name}" to your bag`, 'success');

  // Gentle shake animation on cart button
  const cartBtn = document.getElementById('cart-toggle-btn');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => { cartBtn.style.transform = 'scale(1)'; }, 250);
  }
}

function updateCartItemQty(productId, delta) {
  const item = AppState.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    AppState.cart = AppState.cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartBadge();
  renderCart();
}

function removeCartItem(productId) {
  AppState.cart = AppState.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCart();
  showToast('Item removed from bag', 'info');
}

function renderCart() {
  const listContainer = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountRow = document.getElementById('cart-discount-row');
  const discountEl = document.getElementById('cart-discount-val');
  const shippingEl = document.getElementById('cart-shipping-val');
  const totalEl = document.getElementById('cart-total');
  const shippingBarFill = document.getElementById('shipping-bar-fill');
  const shippingMsg = document.getElementById('shipping-bar-msg');

  if (!listContainer) return;

  if (AppState.cart.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
        <i class="fas fa-shopping-bag" style="font-size: 2.8rem; color: var(--border-medium); margin-bottom: 16px;"></i>
        <h4 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 8px;">Your Shopping Bag is Empty</h4>
        <p style="font-size: 0.85rem; margin-bottom: 24px;">Explore our bespoke timepieces, audio, and curated living objects.</p>
        <button class="btn-acrylic btn-acrylic-gold" onclick="closeCart(); switchPage('categories');">
          Browse Catalog
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = formatPrice(0);
    if (discountRow) discountRow.style.display = 'none';
    if (shippingEl) shippingEl.textContent = formatPrice(0);
    if (totalEl) totalEl.textContent = formatPrice(0);
    if (shippingBarFill) shippingBarFill.style.width = '0%';
    return;
  }

  let subtotal = 0;
  listContainer.innerHTML = AppState.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="cart-item-row">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
            <span style="font-size: 0.85rem; min-width: 20px; text-align: center; font-weight: 600;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;">${formatPrice(itemTotal)}</div>
          <button style="background: none; border: none; color: var(--text-muted); cursor: pointer;" onclick="removeCartItem('${item.id}')" title="Remove">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Calculations
  let discountAmount = 0;
  if (AppState.appliedPromo && AppState.appliedPromo.discountPercent) {
    discountAmount = subtotal * AppState.appliedPromo.discountPercent;
  }

  const freeShippingThreshold = 250;
  const isFreeShip = subtotal >= freeShippingThreshold || (AppState.appliedPromo && AppState.appliedPromo.freeShipping);
  const shippingFee = isFreeShip ? 0 : 25;
  const grandTotal = subtotal - discountAmount + shippingFee;

  // Update Free Shipping Bar
  if (shippingBarFill && shippingMsg) {
    const percent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
    shippingBarFill.style.width = `${percent}%`;
    if (isFreeShip) {
      shippingMsg.innerHTML = `<i class="fas fa-check-circle" style="color: var(--accent-emerald);"></i> <strong>Congratulations!</strong> You have unlocked Free Insured Courier Delivery.`;
    } else {
      const remaining = freeShippingThreshold - subtotal;
      shippingMsg.innerHTML = `Add <strong>${formatPrice(remaining)}</strong> more to unlock <strong>Free Worldwide Shipping</strong>`;
    }
  }

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

  if (discountRow && discountEl) {
    if (discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatPrice(discountAmount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (shippingEl) shippingEl.textContent = isFreeShip ? 'Complimentary' : formatPrice(shippingFee);
  if (totalEl) totalEl.textContent = formatPrice(grandTotal);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const totalCount = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = totalCount;
  badge.style.display = totalCount > 0 ? 'flex' : 'none';
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-badge');
  if (!badge) return;
  badge.textContent = AppState.wishlist.size;
  badge.style.display = AppState.wishlist.size > 0 ? 'flex' : 'none';
}

// ---------------------------------------------------------------------------
// WISHLIST SYSTEM
// ---------------------------------------------------------------------------
function toggleWishlist(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  if (AppState.wishlist.has(productId)) {
    AppState.wishlist.delete(productId);
    showToast(`Removed "${product.name}" from wishlist`, 'info');
  } else {
    AppState.wishlist.add(productId);
    showToast(`Added "${product.name}" to your wishlist`, 'success');
  }

  saveWishlist();
  updateWishlistBadge();
  renderAllViews();
}

// ---------------------------------------------------------------------------
// MODALS (QUICK VIEW & CHECKOUT)
// ---------------------------------------------------------------------------
function initModals() {
  // Modal backdrop click close
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });

  // Close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });
}

function openQuickViewById(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  AppState.activeQuickViewProduct = product;
  const modal = document.getElementById('quickview-modal');
  const body = document.getElementById('quickview-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="quickview-layout">
      <div>
        <img class="quickview-img" src="${product.image}" alt="${product.name}" />
        <div style="display: flex; gap: 10px; margin-top: 12px;">
          <img src="${product.image}" style="width: 60px; height: 60px; border-radius: 8px; border: 2px solid var(--accent-gold); object-fit: cover;" />
          <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center;">
            <i class="fas fa-shield-alt" style="margin-right: 6px; color: var(--accent-gold);"></i> 100% Certified Authentic Object
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column;">
        <span class="product-category-lbl" style="margin-bottom: 4px;">${product.categoryLabel}</span>
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; line-height: 1.25;">${product.name}</h2>
        <div class="product-rating" style="margin-bottom: 16px;">
          <span class="stars">${'★'.repeat(Math.floor(product.rating))}</span>
          <span>${product.rating.toFixed(1)} (${product.reviewsCount} verified owner reviews)</span>
        </div>
        <div class="product-price-bar" style="margin-bottom: 20px;">
          <span class="current-price" style="font-size: 1.6rem;">${formatPrice(product.price)}</span>
          <span class="original-price" style="font-size: 1.1rem;">${formatPrice(product.originalPrice)}</span>
          <span class="product-badge-pill" style="margin-left: auto;">Save ${Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.925rem; line-height: 1.65; margin-bottom: 24px;">
          ${product.description}
        </p>
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 0.825rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px;">Key Specifications</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; color: var(--text-secondary);">
            ${product.features.map(f => `<li><i class="fas fa-check" style="color: var(--accent-gold); margin-right: 8px;"></i>${f}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-top: auto; display: flex; gap: 12px;">
          <button class="btn-acrylic btn-acrylic-gold btn-acrylic-lg" style="flex: 1;" onclick="addToCart('${product.id}', 1); document.getElementById('quickview-modal').classList.remove('open');">
            <i class="fas fa-shopping-bag"></i> Add to Bag • ${formatPrice(product.price)}
          </button>
          <button class="btn-acrylic btn-acrylic-icon" onclick="toggleWishlist('${product.id}')" title="Wishlist">
            <i class="${AppState.wishlist.has(product.id) ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const totalCount = AppState.cart.reduce((s, i) => s + i.quantity, 0);
  let subtotal = AppState.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  let discount = AppState.appliedPromo ? subtotal * (AppState.appliedPromo.discountPercent || 0) : 0;
  let shipping = (subtotal >= 250 || (AppState.appliedPromo && AppState.appliedPromo.freeShipping)) ? 0 : 25;
  let finalAmount = subtotal - discount + shipping;

  const summaryEl = document.getElementById('checkout-order-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div style="padding: 16px; border-radius: var(--radius-md); background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">Items (${totalCount})</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; color: var(--accent-gold);">
            <span>Promo (${AppState.appliedPromo.code})</span>
            <span>-${formatPrice(discount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">Insured Express Courier</span>
          <span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem; border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-top: 8px;">
          <span>Total Due</span>
          <span style="color: var(--accent-gold);">${formatPrice(finalAmount)}</span>
        </div>
      </div>
    `;
  }

  modal.classList.add('open');
}

window.completeCheckoutSimulation = function(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('checkout-modal');
  const body = document.getElementById('checkout-modal-body');
  if (!body) return;

  const orderNum = 'AUR-' + Math.floor(100000 + Math.random() * 900000);

  body.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); border: 2px solid var(--accent-emerald); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; color: var(--accent-emerald); font-size: 2.2rem; box-shadow: 0 0 30px var(--accent-emerald-glow);">
        <i class="fas fa-check"></i>
      </div>
      <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 10px;">Order Confirmed</h2>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">Thank you for acquiring from Aura Luxe. Your creation is being prepared for secure white-glove dispatch.</p>
      <div style="display: inline-block; padding: 12px 24px; border-radius: var(--radius-md); background: rgba(255,255,255,0.06); border: 1px solid var(--border-medium); margin-bottom: 30px; font-family: monospace; font-size: 1.1rem; color: var(--accent-gold);">
        Reference Order: ${orderNum}
      </div>
      <div>
        <button class="btn-acrylic btn-acrylic-gold" onclick="document.getElementById('checkout-modal').classList.remove('open'); AppState.cart = []; saveCart(); updateCartBadge(); location.reload();">
          Continue Exploring Catalog
        </button>
      </div>
    </div>
  `;

  showToast('Order confirmed successfully!', 'success');
};

// ---------------------------------------------------------------------------
// CONTACT FORM & FAQ
// ---------------------------------------------------------------------------
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const ticketId = 'CONCIERGE-' + Math.floor(1000 + Math.random() * 9000);

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Dispatching Message...`;
      submitBtn.disabled = true;
    }

    setTimeout(() => {
      form.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(229, 184, 105, 0.2); border: 1px solid var(--accent-gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: var(--accent-gold); font-size: 1.8rem;">
            <i class="fas fa-envelope-open-text"></i>
          </div>
          <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">Message Received</h3>
          <p style="color: var(--text-secondary); margin-bottom: 18px;">Thank you, ${name}. Our private concierge team has received your inquiry and will reply to <strong>${email}</strong> within 2 hours.</p>
          <div style="font-size: 0.85rem; color: var(--text-muted); font-family: monospace;">Case Reference: ${ticketId}</div>
        </div>
      `;
      showToast('Concierge inquiry dispatched successfully!', 'success');
    }, 900);
  });
}

function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(other => other.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ---------------------------------------------------------------------------
// BEST SELLER COUNTDOWN TIMER
// ---------------------------------------------------------------------------
function initBestsellerCountdown() {
  const hoursEl = document.getElementById('timer-hours');
  const minutesEl = document.getElementById('timer-minutes');
  const secondsEl = document.getElementById('timer-seconds');
  if (!hoursEl || !minutesEl || !secondsEl) return;

  let totalSeconds = (5 * 3600) + (42 * 60) + 18; // 5 hours 42 min

  setInterval(() => {
    if (totalSeconds > 0) totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// ---------------------------------------------------------------------------
// TOAST NOTIFICATION ENGINE
// ---------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-acrylic';

  let icon = 'fa-info-circle';
  let color = 'var(--accent-gold)';
  if (type === 'success') {
    icon = 'fa-check-circle';
    color = 'var(--accent-emerald)';
  } else if (type === 'error') {
    icon = 'fa-exclamation-circle';
    color = '#EF4444';
  } else if (type === 'warning') {
    icon = 'fa-bolt';
    color = '#F59E0B';
  }

  toast.innerHTML = `
    <i class="fas ${icon}" style="color: ${color}; font-size: 1.1rem;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
