import compact from 'lodash-es/compact';
import find from 'lodash-es/find';
import forEach from "lodash-es/forEach";
import fromPairs from 'lodash-es/fromPairs';
import isArray from "lodash-es/isArray";
import isEmpty from 'lodash-es/isEmpty';
import join from 'lodash-es/join';
import map from 'lodash-es/map';
import toNumber from 'lodash-es/toNumber';
import ProductsStorage from "../../classes/ProductsStorage";
import { decOfNum } from "../../helper/decOfNum";
import { pageDisableScroll, pageEnableScroll } from "../../helper/pageToggleScroll";

export default function ProductsContent() {
    const parent = document.querySelector('.products');
    if (!parent) return;

    const grid = parent.querySelector('.products__grid');
    const values = parent.querySelector('.products__head-values');
    const template = parent.querySelector('template#product-card--template');
    const aside = parent.querySelector('.products__aside');
    const filtersBlock = parent.querySelector('.products__filter');

    if(!template) {

        console.error(
            'Template for product card is not found. ' +
            'Please, check if you have added template for product card.'
        );

        return;
    }

    const renderProductCard = (product) => {
        const node = template.content.cloneNode(true);
        const parent = node.querySelector('.product-card');
        const img = node.querySelector('.product-card__image img');
        const title = node.querySelector('.product-card__title');
        const price = node.querySelector('.product-card__footer-price');
        const quantityParent = node.querySelector('.input-score');
        const quantityInput = quantityParent.querySelector('input[name="product-item"]');
        const quantityInputLabel = quantityParent.querySelector('.input-score__value');

        parent.dataset.productId = product.id;
        parent.dataset.status = join(compact([
            product.isNew ? 'isNew' : '',
            product.inStock ? 'inStock' : '',
            product.isContract ? 'isContract' : '',
            product.isExclusive ? 'isExclusive' : '',
            product.isSale ? 'isSale' : '',
        ]), ' ');

        img.src = product.image || './files/images/no-photo.jpg';
        img.alt = product.title || 'product';
        title.textContent = product.name;
        price.textContent = `${product.price} ₽`;

        // Проверка, есть ли товар в корзине
        const existingProduct = find(window.basketStorage?.products, p => p.productID == product.id);
        const quantity = existingProduct?.quantity || 0;
        quantityInput.setAttribute('value', quantity);
        quantityInputLabel.textContent = quantity;

        if(quantity > 0 && quantityParent.classList.contains('input-score--hidden-controls')) {
            quantityParent.classList.remove('input-score--hidden-controls');
        }

        // Слушатель изменения количества
        quantityInput.addEventListener('change', (event) => {
            const newQuantity = toNumber(event.target.getAttribute('value'));

            if (!window.basketStorage) return;

            const existing = find(window.basketStorage.products, p => p.productID == product.id);
            const prevQuantity = existing?.quantity || 0;

            if (prevQuantity === 0 && newQuantity > 0) {
                window.basketStorage.addProduct(product.id, newQuantity);
            } else {
                window.basketStorage.updateProductQuantity(product.id, newQuantity);
            }
        });


        return node;
    };

    const productsStorage = new ProductsStorage({
        onStatusChange: (status) => {
            parent.dataset.status = status;
        },
        onProductCountChange: (count) => {
            if (values) {
                values.textContent = `${count} ${decOfNum(count, ['товар', 'товара', 'товаров'])}`;
            }
        },
        onProductsUpdate: (products) => {
            if (!isArray(products)) return;

            grid.innerHTML = '';

            forEach(products, product => {
                grid.appendChild(renderProductCard(product));
            });
        }
    });

    const readFilters = () => {
        const inputs = filtersBlock.querySelectorAll('input[type="checkbox"]:checked');
        if(!inputs.length) return;

        const pairs = map([...inputs], input => [input.value, true]);

        return fromPairs(pairs);
    };

    filtersBlock.addEventListener('change', () => {
        productsStorage.setFilters(readFilters());
    });

    const sortingInput = parent.querySelector('input[name="product_sort"]');

    sortingInput?.addEventListener('change', () => {
        const sortValue = sortingInput.value;
        productsStorage.setSort(sortValue);
    });
    
    window.productsStorage = productsStorage;
    productsStorage.setFilters(readFilters());
    productsStorage.setSort(sortingInput?.value || '');
    productsStorage.getProducts();

    window.addEventListener('basket:updated', (event) => {
        const updated = event.detail.products;
        const cards = parent.querySelectorAll('.product-card');

        if(isEmpty(cards)) return;

        forEach([...cards], (card) => {
            const productID = card.dataset.productId;
            const quantityInput = card.querySelector('input[name="product-item"]');
            const quantityLabel = card.querySelector('.input-score__value');
            const quantityParent = card.querySelector('.input-score');

            const match = find(updated, p => p.productID == productID);
            const quantity = match?.quantity || 0;

            quantityInput.value = quantity;
            quantityLabel.textContent = quantity;

            if(quantity > 0) {
                quantityParent.classList.remove('input-score--hidden-controls');
            } else {
                quantityParent.classList.add('input-score--hidden-controls');
            }
        });
    });

    // 

    const filterButton = parent.querySelector('.products__head-filter');

    const asideShowHandler = () => {
        if(!aside) return;

        aside.classList.add('products__aside--dropped');
        pageDisableScroll();
    }
    
    const asideHideHandler = () => {
        if(!aside && aside.classList.contains('product__aside--dropped')) return;
        
        aside.classList.remove('products__aside--dropped');
        pageEnableScroll();
    }

    if(filterButton && aside) {
        filterButton.addEventListener('click', () => {
            console.info('cloick');

            if(aside.classList.contains('products__aside--dropped')) {
                asideHideHandler();
            } else {
                asideShowHandler();
            }
        });
    }

    if(aside) {
        window.addEventListener('breakpoint:change', (event) => {
            const { isMobile } = event.detail;

            if (!isMobile && aside.classList.contains('products__aside--dropped')) {
                aside.classList.remove('products__aside--dropped');
            }
        })

        window.addEventListener('click', (event) => {
            const isMobile = window.breakpointObserver?.isMobile;
            const isAsideOpen = aside.classList.contains('products__aside--dropped');

            if (!isMobile || !isAsideOpen) return;

            const clickInsideAside = aside.contains(event.target);
            const clickOnFilterButton = filterButton?.contains(event.target);

            if (!clickInsideAside && !clickOnFilterButton) {
                asideHideHandler();
            }
        });
    }
}
