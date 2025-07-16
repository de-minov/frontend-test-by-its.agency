import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

export default function Banner() {
    const banner = document.querySelector('.banner');
    
    if(!banner) return;

    const slider = banner.querySelector('.swiper');

    if(!slider) return;

    const navigationPrev = slider.querySelector('.banner__navigation--prev');
    const navigationNext = slider.querySelector('.banner__navigation--next');
    const pagination = slider.querySelector('.banner__pagination');

    new Swiper('.banner .swiper', {
        modules: [Navigation, Pagination],
        loop: true,
        autoplay: {
            delay: 5000,
            pauseOnMouseEnter: true,
        },
        navigation: {
            nextEl: navigationNext || null,
            prevEl: navigationPrev || null,
        },
        pagination: {
            el: pagination || null,
            clickable: true,
        }
    })
}