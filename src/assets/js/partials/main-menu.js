class NavigationMenu extends HTMLElement {
    connectedCallback() {
        // Seed a skeleton placeholder shown until the menu data is fetched
        // and render() replaces this innerHTML with the real menu.
        this.innerHTML = `
            <div class="main-menu-skel" aria-hidden="true">
                <span class="header-skel-item header-skel-item--menu" style="width:80px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:60px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:90px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:70px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:80px"></span>
            </div>`;

        // IMPORTANT: Register the global click handler immediately on connect,
        // BEFORE the async API call. This ensures the hamburger button works
        // as soon as the drawer is rendered, regardless of app.js timing.
        this._registerGlobalListeners();

        salla.onReady()
            .then(() => salla.lang.onLoaded())
            .then(() => {
                this.menus = [];
                this.displayAllText = salla.lang.get('blocks.home.display_all');
                this.moreText = salla.lang.get('common.titles.more');
                this.visibleMenus = [];
                this.overflowMenus = [];

                return salla.api.component.getMenus()
                .then(({ data }) => {
                    this.menus = data;
                    return this.render()
                }).then(() => {
                    this.initializeResponsiveMenu();
                    this.initMobileAccordion();
                }).catch((error) => salla.logger.error('salla-menu::Error fetching menus', error));
            });
    }

    /**
    * Register document-level listeners immediately so the hamburger trigger
    * works as soon as the drawer DOM exists — no dependency on app.js timing.
    */
    _registerGlobalListeners() {
        // Only register once
        if (NavigationMenu._listenersRegistered) return;
        NavigationMenu._listenersRegistered = true;

        const self = this;

        // Hamburger trigger — open drawer
        document.addEventListener('click', function(e) {
            const trigger = e.target.closest("a[href='#mobile-menu']") || e.target.closest('.zod-header__mobile-menu');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                const drawer = document.getElementById('zod-mobile-drawer');
                if (drawer) {
                    drawer.classList.add('is-open');
                    document.body.classList.add('zod-drawer-open', 'menu-opened');
                    document.body.style.overflow = 'hidden';
                }
            }
        }, true); // Use capture phase to intercept before other handlers

        // Close button
        document.addEventListener('click', function(e) {
            if (e.target.closest('#zod-drawer-close') || e.target.closest('.zod-mobile-drawer__close')) {
                e.preventDefault();
                NavigationMenu._closeDrawer();
            }
        });

        // Overlay click
        document.addEventListener('click', function(e) {
            if (e.target.closest('#zod-drawer-overlay') || (e.target.classList && e.target.classList.contains('zod-mobile-drawer__overlay'))) {
                NavigationMenu._closeDrawer();
            }
        });

        // Legacy close buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.close-mobile-menu')) {
                NavigationMenu._closeDrawer();
            }
        });

        // Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const drawer = document.getElementById('zod-mobile-drawer');
                if (drawer && drawer.classList.contains('is-open')) {
                    NavigationMenu._closeDrawer();
                }
            }
        });
    }

    static _closeDrawer() {
        const drawer = document.getElementById('zod-mobile-drawer');
        if (drawer) {
            drawer.classList.remove('is-open');
            document.body.classList.remove('zod-drawer-open', 'menu-opened');
            document.body.style.overflow = '';
        }
    }

    /** 
    * Check if the menu has children
    * @param {Object} menu
    * @returns {Boolean}
    */
    hasChildren(menu) {
        return menu?.children?.length > 0;
    }

    /**
    * Check if the menu has products
    * @param {Object} menu
    * @returns {Boolean}
    */
    hasProducts(menu) {
        return menu?.products?.length > 0;
    }

    /**
    * Get the classes for desktop menu
    * @param {Object} menu
    * @param {Boolean} isRootMenu
    * @returns {String}
    */
    getDesktopClasses(menu, isRootMenu) {
        return `!hidden lg:!block ${isRootMenu ? 'root-level lg:!inline-block' : 'relative'} ${menu.products ? ' mega-menu' : ''}
        ${this.hasChildren(menu) ? ' has-children' : ''}`
    }

    /**
    * Get the mobile menu — accordion-style
    * @param {Object} menu
    * @param {String} displayAllText
    * @param {Number} depth
    * @returns {String}
    */
    getMobileMenu(menu, displayAllText, depth = 0) {
        const menuImage = menu.image
            ? `<img src="${menu.image}" class="zod-mobile-menu__image rounded-full" width="40" height="40" alt="${menu.title}" loading="lazy" />`
            : '';
        const hasKids = this.hasChildren(menu);
        const itemTypeClass = hasKids ? 'zod-mobile-menu__item--has-children' : 'zod-mobile-menu__item--leaf';
        const depthClass = depth > 0 ? `zod-mobile-menu__item--depth-${depth}` : '';

        if (!hasKids) {
            return `
            <li class="zod-mobile-menu__item ${itemTypeClass} ${depthClass}" ${menu.attrs}>
                <a href="${menu.url}" aria-label="${menu.title || 'category'}" class="zod-mobile-menu__link ${menu.image ? 'has-image' : ''}" ${menu.link_attrs}>
                    ${menuImage}
                    <span class="zod-mobile-menu__label">${menu.title || ''}</span>
                </a>
            </li>`;
        }

        const childrenHtml = menu.children.map(sub => this.getMobileMenu(sub, displayAllText, depth + 1)).join('');

        return `
        <li class="zod-mobile-menu__item ${itemTypeClass} ${depthClass}" ${menu.attrs}>
            <div class="zod-mobile-menu__parent-row ${menu.image ? 'has-image' : ''}">
                <a href="${menu.url}" class="zod-mobile-menu__parent-link" aria-label="${menu.title || 'category'}">
                    ${menuImage}
                    <span class="zod-mobile-menu__label">${menu.title || ''}</span>
                </a>
                <button class="zod-mobile-menu__toggle" aria-expanded="false" aria-label="expand submenu">
                    <span class="zod-mobile-menu__arrow"></span>
                </button>
            </div>
            <ul class="zod-mobile-menu__sub" aria-hidden="true">
                <li class="zod-mobile-menu__item zod-mobile-menu__item--all">
                    <a href="${menu.url}" class="zod-mobile-menu__link">${displayAllText}</a>
                </li>
                ${childrenHtml}
            </ul>
        </li>`;
    }

    /**
    * Get the desktop menu
    * @param {Object} menu
    * @param {Boolean} isRootMenu
    * @param {String} additionalClasses
    * @returns {String}
    */
    getDesktopMenu(menu, isRootMenu, additionalClasses = '') {
        return `
        <li class="${this.getDesktopClasses(menu, isRootMenu)} ${additionalClasses}" ${menu.attrs} data-menu-item>
            <a href="${menu.url}" aria-label="${menu.title || 'category'}" ${menu.link_attrs}>
                <span>${menu.title}</span>
            </a>
            ${this.hasChildren(menu) ? `
                <div class="sub-menu ${this.hasProducts(menu) ? 'w-full left-0 flex' : 'w-56'}">
                    <ul class="${this.hasProducts(menu) ? 'w-56 shrink-0 m-8 rtl:ml-0 ltr:mr-0' : ''}">
                        ${menu.children.map((subMenu) => this.getDesktopMenu(subMenu, false)).join('\n')}
                    </ul>
                    ${this.hasProducts(menu) ? `
                    <salla-products-list
                    source="selected"
                    shadow-on-hover
                    source-value="[${menu.products}]" />` : ''}
                </div>` : ''}
        </li>`;
    }

    /**
    * Get the menus split for mobile and desktop
    * @returns {Object} { mobileHtml, desktopHtml }
    */
    getMenusSplit() {
        const mobileHtml = this.menus.map(menu => this.getMobileMenu(menu, this.displayAllText, 0)).join('\n');
        const desktopHtml = this.menus.map(menu => this.getDesktopMenu(menu, true)).join('\n');
        return { mobileHtml, desktopHtml };
    }

    /**
    * Create More dropdown menu
    * @returns {String}
    */
    createMoreDropdown() {
        if (this.overflowMenus.length === 0) return '';

        return `
        <li class="!hidden lg:!block root-level lg:!inline-block has-children relative" id="more-menu-dropdown">
            <a href="#" aria-label="${this.moreText}">
                <span>${this.moreText}</span>
            </a>
            <div class="sub-menu w-56">
                <ul>
                    ${this.overflowMenus.map((menu) => this.getDesktopMenu(menu, false)).join('\n')}
                </ul>
            </div>
        </li>`;
    }

    /*
    * Initialize responsive menu functionality
    */
    initializeResponsiveMenu() {
        if (window.innerWidth < 1024) return;

        const mainMenu = this.querySelector('.zod-desktop-menu');
        if (!mainMenu) return;

        const isMoreMenuEnabled = window.enable_more_menu;
        if (!isMoreMenuEnabled) return;

        this.checkMenuOverflow();

        const resizeHandler = this.debounce(() => {
            this.checkMenuOverflow();
        }, 250);

        window.addEventListener('resize', resizeHandler);
    }

    /**
    * Check if menu items overflow and move them to More dropdown
    */
    checkMenuOverflow() {
        const mainMenu = this.querySelector('.zod-desktop-menu');
        if (!mainMenu) return;

        const container = mainMenu.closest('.container');
        if (!container) return;

        this.visibleMenus = [...this.menus];
        this.overflowMenus = [];

        const existingMore = mainMenu.querySelector('#more-menu-dropdown');
        if (existingMore) existingMore.remove();

        const menuItems = mainMenu.querySelectorAll('.root-level[data-menu-item]');
        menuItems.forEach(item => { item.style.display = ''; });

        const containerWidth = container.offsetWidth;
        const otherElements = container.querySelector('.flex') ? container.querySelector('.flex').children : [];
        let usedWidth = 0;

        Array.from(otherElements).forEach(element => {
            if (!element.contains(mainMenu)) {
                usedWidth += element.offsetWidth;
            }
        });

        const availableWidth = containerWidth - usedWidth - 300;
        let currentWidth = 0;
        let visibleCount = 0;

        menuItems.forEach((item, index) => {
            const itemWidth = item.offsetWidth;
            if (currentWidth + itemWidth <= availableWidth && index < this.menus.length) {
                currentWidth += itemWidth;
                visibleCount++;
            } else {
                item.style.setProperty('display', 'none', 'important');
                if (index < this.menus.length) {
                    this.overflowMenus.push(this.menus[index]);
                }
            }
        });

        this.visibleMenus = this.menus.slice(0, visibleCount);

        if (this.overflowMenus.length > 0) {
            mainMenu.insertAdjacentHTML('beforeend', this.createMoreDropdown());
        }
    }

    /**
    * Initialize accordion behavior for mobile menu
    */
    initMobileAccordion() {
        const mobileNav = this.querySelector('.zod-mobile-nav');
        if (!mobileNav) return;

        mobileNav.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.zod-mobile-menu__toggle');
            if (!toggleBtn) return;

            e.preventDefault();
            e.stopPropagation();

            const parentItem = toggleBtn.closest('.zod-mobile-menu__item--has-children');
            if (!parentItem) return;

            const subMenu = parentItem.querySelector(':scope > .zod-mobile-menu__sub');
            if (!subMenu) return;

            const isOpen = parentItem.classList.contains('is-open');

            // Close siblings at same level
            const siblings = parentItem.parentElement
                ? Array.from(parentItem.parentElement.children).filter(el => el !== parentItem && el.classList.contains('zod-mobile-menu__item--has-children'))
                : [];
            siblings.forEach(sib => {
                sib.classList.remove('is-open');
                const sibToggle = sib.querySelector(':scope > .zod-mobile-menu__parent-row > .zod-mobile-menu__toggle');
                const sibSub = sib.querySelector(':scope > .zod-mobile-menu__sub');
                if (sibToggle) sibToggle.setAttribute('aria-expanded', 'false');
                if (sibSub) {
                    sibSub.style.maxHeight = '0';
                    sibSub.setAttribute('aria-hidden', 'true');
                }
            });

            if (isOpen) {
                parentItem.classList.remove('is-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                subMenu.style.maxHeight = '0';
                subMenu.setAttribute('aria-hidden', 'true');
            } else {
                parentItem.classList.add('is-open');
                toggleBtn.setAttribute('aria-expanded', 'true');
                subMenu.style.maxHeight = subMenu.scrollHeight + 'px';
                subMenu.setAttribute('aria-hidden', 'false');
                // After transition, allow natural height for nested opens
                subMenu.addEventListener('transitionend', () => {
                    if (parentItem.classList.contains('is-open')) {
                        subMenu.style.maxHeight = 'none';
                    }
                }, { once: true });
            }
        });
    }

    /**
    * Debounce function to limit resize event calls
    * @param {Function} func
    * @param {Number} wait
    * @returns {Function}
    */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
    * Render the header menu — separate mobile drawer from desktop nav
    */
    render() {
        const { mobileHtml, desktopHtml } = this.getMenusSplit();

        this.innerHTML = `
        <!-- Mobile Drawer -->
        <div class="zod-mobile-drawer" id="zod-mobile-drawer" role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
            <div class="zod-mobile-drawer__overlay" id="zod-drawer-overlay"></div>
            <div class="zod-mobile-drawer__panel">
                <div class="zod-mobile-drawer__header">
                    <span class="zod-mobile-drawer__title">الأقسام</span>
                    <button class="zod-mobile-drawer__close" id="zod-drawer-close" aria-label="إغلاق القائمة">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <nav class="zod-mobile-nav" aria-label="Mobile navigation">
                    <ul class="zod-mobile-menu__list">
                        ${mobileHtml}
                    </ul>
                </nav>
            </div>
        </div>

        <!-- Desktop Navigation (hidden on mobile) -->
        <ul class="zod-desktop-menu main-menu" aria-label="Desktop navigation">
            ${desktopHtml}
        </ul>

        <!-- Legacy close button for compatibility -->
        <button class="btn--close-sm close-mobile-menu sicon-cancel hidden"></button>`;
    }
}

// Static flag to prevent duplicate listener registration
NavigationMenu._listenersRegistered = false;

customElements.define('custom-main-menu', NavigationMenu);
