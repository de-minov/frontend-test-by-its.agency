export const pageDisableScroll = () => {
    const html = document.documentElement;
    const body = document.body;

    const gutter = window.innerWidth - body.clientWidth;
    const mql = window.matchMedia('screen and (max-width: 2560px)').matches;

    if (gutter > 0) {
        if (mql) {
            body.style.setProperty('--scrolling-gutter', gutter + 'px');
        } else {
            body.style.setProperty('--scrolling-gutter-body', gutter + 'px');
        }
    }

    html.dataset.noScroll = '';

    const event = new CustomEvent('page-disable-scroll', { detail: { gutter } });
    window.dispatchEvent(event);
};

export const pageEnableScroll = () => {
    const html = document.documentElement;
    const body = document.body;
    
    body.style.setProperty('--scrolling-gutter', '');
    body.style.setProperty('--scrolling-gutter-body', '');

    delete html.dataset.noScroll;

    const event = new CustomEvent('page-enable-scroll');
    window.dispatchEvent(event);
};

export const pageToggleScroll = () => {
    !document.documentElement.dataset.noScroll
        ? pageDisableScroll()
        : pageEnableScroll();
}