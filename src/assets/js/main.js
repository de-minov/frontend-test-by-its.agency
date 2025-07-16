import { register } from 'swiper/element/bundle';
import Banner from '../../common/components/Banner/Banner';
import BasketContent from '../../common/components/Basket/Basket';
import InputScore from '../../common/components/InputScore/InputScore';
import InputSelect from '../../common/components/InputSelect/InputSelect';
import ProductsContent from '../../common/components/ProductsContent/ProductsContent';
import BreakpointObserver from '../../common/helper/BreakpointObserver';

register();

window.breakpointObserver = new BreakpointObserver();

document.addEventListener('DOMContentLoaded', () => {
    InputSelect();
    InputScore();
    Banner();
    BasketContent();
    ProductsContent();
});