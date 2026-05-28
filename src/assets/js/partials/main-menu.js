class NavigationMenu extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="main-menu-skel" aria-hidden="true">
                <span class="header-skel-item header-skel-item--menu" style="width:80px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:60px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:90px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:70px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:80px"></span>
            </div>`;

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
                        return this.render();
                    })
                    .then(() => {
                        this.initializeResponsiveMenu();
                        this.initMobileAccordion();
                    })
                    .catch((error) => salla.logger.error('salla-menu::Error fetching menus', error));
            });
    }

    _registerGlobalListeners() {
        if (NavigationMenu._listenersRegistered) return;
        NavigationMenu._listenersRegistered = true;

        document.addEventListener('click', (event) => {
            const trigger = event.target.closest("a[href='#mobile-menu']") || event.target.closest('.zod-header__mobile-menu');
            if (!trigger || !NavigationMenu._isMobileViewport()) return;

            event.preventDefault();
            NavigationMenu._openDrawer();
        }, true);

        document.addEventListener('click', (event) => {
            if (event.target.closest('#zod-drawer-close') || event.target.closest('.zod-mobile-drawer__close')) {
                event.preventDefault();
                NavigationMenu._closeDrawer();
                return;
            }

            const overlay = event.target.closest('#zod-drawer-overlay') || (event.target.classList && event.target.classList.contains('zod-mobile-drawer__overlay'));
            if (overlay) {
                event.preventDefault();
                NavigationMenu._closeDrawer();
                return;
            }

            const mobileLink = event.target.closest('.zod-mobile-menu__link, .zod-mobile-menu__parent-link');
            const isToggle = event.target.closest('.zod-mobile-menu__toggle');
            if (mobileLink && !isToggle) {
                NavigationMenu._closeDrawer();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                NavigationMenu._closeDrawer();
            }
        });

        window.addEventListener('resize', () => {
            if (!NavigationMenu._isMobileViewport()) {
                NavigationMenu._closeDrawer(true);
            }
        }, { passive: true });
    }

    static _isMobileViewport() {
        return window.matchMedia('(max-width: 1023px)').matches;
    }

    static _getDrawer() {
        return document.getElementById('zod-mobile-drawer');
    }

    static _lockBodyScroll() {
        if (NavigationMenu._scrollLocked) return;

        NavigationMenu._savedScrollY = window.scrollY || window.pageYOffset || 0;
        document.documentElement.classList.add('zod-drawer-open');
        document.body.classList.add('zod-drawer-open');
        document.body.style.position = 'fixed';
        document.body.style.top = `-${NavigationMenu._savedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        NavigationMenu._scrollLocked = true;
    }

    static _unlockBodyScroll() {
        if (!NavigationMenu._scrollLocked) return;

        const storedTop = parseInt(document.body.style.top || '0', 10);
        const scrollY = Number.isNaN(storedTop) ? NavigationMenu._savedScrollY : Math.abs(storedTop);

        document.documentElement.classList.remove('zod-drawer-open');
        document.body.classList.remove('zod-drawer-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY || 0);

        NavigationMenu._scrollLocked = false;
        NavigationMenu._savedScrollY = 0;
    }

    static _openDrawer() {
        const drawer = NavigationMenu._getDrawer();
        if (!drawer) return;

        clearTimeout(NavigationMenu._closeTimer);
        drawer.classList.remove('is-closing');
        drawer.setAttribute('aria-hidden', 'false');
        NavigationMenu._lockBodyScroll();

        requestAnimationFrame(() => {
            drawer.classList.add('is-open');
        });
    }

    static _closeDrawer(force = false) {
        const drawer = NavigationMenu._getDrawer();
        if (!drawer) {
            NavigationMenu._unlockBodyScroll();
            return;
        }

        clearTimeout(NavigationMenu._closeTimer);
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        NavigationMenu._unlockBodyScroll();

        if (force) {
            drawer.classList.remove('is-closing');
            return;
        }

        drawer.classList.add('is-closing');
        NavigationMenu._closeTimer = setTimeout(() => {
            drawer.classList.remove('is-closing');
        }, NavigationMenu._drawerAnimationDuration);
    }

    hasChildren(menu) {
        return menu?.children?.length > 0;
    }

    hasProducts(menu) {
        return menu?.products?.length > 0;
    }

    getDesktopClasses(menu, isRootMenu) {
        return `!hidden lg:!block ${isRootMenu ? 'root-level lg:!inline-block' : 'relative'} ${menu.products ? ' mega-menu' : ''}
        ${this.hasChildren(menu) ? ' has-children' : ''}`;
    }

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

    getMenusSplit() {
        const mobileHtml = this.menus.map(menu => this.getMobileMenu(menu, this.displayAllText, 0)).join('\n');
        const desktopHtml = this.menus.map(menu => this.getDesktopMenu(menu, true)).join('\n');
        return { mobileHtml, desktopHtml };
    }

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

    _setSubmenuState(parentItem, isOpen) {
        const toggleBtn = parentItem.querySelector(':scope > .zod-mobile-menu__parent-row > .zod-mobile-menu__toggle');
        const subMenu = parentItem.querySelector(':scope > .zod-mobile-menu__sub');
        if (!toggleBtn || !subMenu) return;

        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        subMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

        if (isOpen) {
            parentItem.classList.add('is-open');
            subMenu.style.maxHeight = `${subMenu.scrollHeight}px`;
            requestAnimationFrame(() => this._refreshAncestorHeights(parentItem));
            return;
        }

        if (subMenu.style.maxHeight === 'none' || !subMenu.style.maxHeight) {
            subMenu.style.maxHeight = `${subMenu.scrollHeight}px`;
        }

        requestAnimationFrame(() => {
            parentItem.classList.remove('is-open');
            subMenu.style.maxHeight = '0px';
            this._refreshAncestorHeights(parentItem.parentElement?.closest('.zod-mobile-menu__item--has-children'));
        });
    }

    _refreshAncestorHeights(startItem) {
        let currentItem = startItem;

        while (currentItem) {
            const currentSub = currentItem.querySelector(':scope > .zod-mobile-menu__sub');
            if (currentSub && currentItem.classList.contains('is-open')) {
                currentSub.style.maxHeight = `${currentSub.scrollHeight}px`;
            }
            currentItem = currentItem.parentElement?.closest('.zod-mobile-menu__item--has-children');
        }
    }

    initMobileAccordion() {
        const mobileNav = this.querySelector('.zod-mobile-nav');
        if (!mobileNav) return;

        mobileNav.addEventListener('click', (event) => {
            const toggleBtn = event.target.closest('.zod-mobile-menu__toggle');
            if (!toggleBtn) return;

            event.preventDefault();
            event.stopPropagation();

            const parentItem = toggleBtn.closest('.zod-mobile-menu__item--has-children');
            if (!parentItem) return;

            const isOpen = parentItem.classList.contains('is-open');
            const siblings = parentItem.parentElement
                ? Array.from(parentItem.parentElement.children).filter((element) => element !== parentItem && element.classList.contains('zod-mobile-menu__item--has-children'))
                : [];

            siblings.forEach((sibling) => this._setSubmenuState(sibling, false));
            this._setSubmenuState(parentItem, !isOpen);
        });
    }

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

    render() {
        const { mobileHtml, desktopHtml } = this.getMenusSplit();

        this.innerHTML = `
        <!-- Mobile Drawer -->
        <div class="zod-mobile-drawer" id="zod-mobile-drawer" role="dialog" aria-modal="true" aria-hidden="true" aria-label="القائمة الرئيسية">
            <div class="zod-mobile-drawer__overlay" id="zod-drawer-overlay"></div>
            <div class="zod-mobile-drawer__panel">
                <div class="zod-mobile-drawer__header">
                    <button class="zod-mobile-drawer__close" id="zod-drawer-close" aria-label="إغلاق القائمة">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <span class="zod-mobile-drawer__title">الأقسام</span>
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

NavigationMenu._listenersRegistered = false;
NavigationMenu._scrollLocked = false;
NavigationMenu._savedScrollY = 0;
NavigationMenu._closeTimer = null;
NavigationMenu._drawerAnimationDuration = 420;

customElements.define('custom-main-menu', NavigationMenu);
