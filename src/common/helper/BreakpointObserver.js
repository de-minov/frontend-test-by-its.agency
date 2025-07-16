export default class BreakpointObserver {
    isMobile = undefined;
    isDesktop = undefined;

    #mediaQuery = window.matchMedia(
        'screen and (max-width: 768px) and (max-height: 1023px) and (orientation: portrait)'
    );

    constructor() {
        this._handleChange = this._handleChange.bind(this);
        this.#mediaQuery.addEventListener('change', this._handleChange);
        this._handleChange(this.#mediaQuery); // initial trigger
    }

    _handleChange(e) {
        this.isMobile = e.matches;
        this.isDesktop = !e.matches;

        const event = new CustomEvent('breakpoint:change', {
            detail: {
                isMobile: this.isMobile,
                isDesktop: this.isDesktop
            }
        });

        window.dispatchEvent(event);
    }

    destroy() {
        this.#mediaQuery.removeEventListener('change', this._handleChange);
    }
}
