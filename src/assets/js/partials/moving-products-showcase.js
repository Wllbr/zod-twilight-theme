class ZodMovingProductsShowcase {
    constructor() {
        this.instances = new WeakMap();
    }

    init() {
        document.querySelectorAll('[data-zod-moving-products-showcase]').forEach(section => this.prepare(section));

        if (window.salla?.hooks?.registerHook) {
            salla.hooks.registerHook('salla-products-slider', 'componentDidLoad', component => {
                const section = component.closest?.('[data-zod-moving-products-showcase]');
                if (section) {
                    this.prepare(section, component);
                }
            });
        }
    }

    prepare(section, slider = null) {
        if (!section || this.instances.has(section)) {
            return;
        }

        const sliderElement = slider || section.querySelector('salla-products-slider');
        if (!sliderElement) {
            return;
        }

        const motionEnabled = section.dataset.motionEnabled !== 'false';
        if (!motionEnabled) {
            this.instances.set(section, { disabled: true });
            return;
        }

        const speed = this.normalizeSpeed(section.dataset.motionSpeed);
        const state = {
            section,
            sliderElement,
            timer: null,
            paused: false,
            attempts: 0,
            interval: Math.max(1400, Math.round((speed * 1000) / 16))
        };

        this.instances.set(section, state);
        this.bindHoverPause(state);
        this.bindInteractionPause(state);
        this.startWhenReady(state);
    }

    normalizeSpeed(value) {
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            return 42;
        }
        return Math.min(90, Math.max(16, parsed));
    }

    bindHoverPause(state) {
        state.section.addEventListener('mouseenter', () => {
            state.paused = true;
        }, { passive: true });

        state.section.addEventListener('mouseleave', () => {
            state.paused = false;
        }, { passive: true });
    }

    bindInteractionPause(state) {
        ['touchstart', 'pointerdown', 'focusin'].forEach(eventName => {
            state.section.addEventListener(eventName, () => {
                state.paused = true;
                window.clearTimeout(state.resumeTimer);
            }, { passive: true });
        });

        ['touchend', 'pointerup', 'pointercancel', 'focusout'].forEach(eventName => {
            state.section.addEventListener(eventName, () => {
                window.clearTimeout(state.resumeTimer);
                state.resumeTimer = window.setTimeout(() => {
                    state.paused = false;
                }, 1800);
            }, { passive: true });
        });
    }

    startWhenReady(state) {
        const tryStart = () => {
            const controller = this.getSliderController(state.sliderElement);
            state.attempts += 1;

            if (controller) {
                this.decorateSlider(state.sliderElement);
                this.startLoop(state, controller);
                return;
            }

            if (state.attempts < 24) {
                window.setTimeout(tryStart, 350);
            }
        };

        tryStart();
    }

    getSliderController(sliderElement) {
        const possibleInstances = [
            sliderElement?.swiper,
            sliderElement?.slider?.swiper,
            sliderElement?.slider,
            sliderElement?.swiperInstance
        ].filter(Boolean);

        const instance = possibleInstances.find(item => typeof item.slideNext === 'function');
        if (instance) {
            return {
                next: () => instance.slideNext(900),
                pause: () => instance.autoplay?.stop?.(),
                resume: () => instance.autoplay?.start?.()
            };
        }

        const root = sliderElement.shadowRoot || sliderElement;
        const nextButton = root.querySelector?.('.swiper-button-next, .s-slider-next, [aria-label="Next Slide"], [aria-label="Next"]');
        if (nextButton) {
            return {
                next: () => nextButton.click(),
                pause: () => {},
                resume: () => {}
            };
        }

        return null;
    }

    decorateSlider(sliderElement) {
        const root = sliderElement.shadowRoot || sliderElement;
        const swiperWrapper = root.querySelector?.('.swiper-wrapper');
        if (swiperWrapper) {
            swiperWrapper.classList.add('zod-moving-products-showcase__swiper-wrapper');
        }

        root.querySelectorAll?.('.swiper-slide').forEach(slide => {
            slide.classList.add('zod-moving-products-showcase__slide');
        });
    }

    startLoop(state, controller) {
        controller.resume();
        window.clearInterval(state.timer);

        state.timer = window.setInterval(() => {
            if (!document.body.contains(state.section)) {
                window.clearInterval(state.timer);
                return;
            }

            if (!state.paused) {
                controller.next();
            } else {
                controller.pause();
            }
        }, state.interval);
    }
}

export default ZodMovingProductsShowcase;
