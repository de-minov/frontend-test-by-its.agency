import compact from "lodash-es/compact";
import forEach from "lodash-es/forEach";
import isArray from "lodash-es/isArray";
import isEmpty from "lodash-es/isEmpty";
import join from "lodash-es/join";
import some from "lodash-es/some";
import toNumber from "lodash-es/toNumber";
import BasketStorage from "../../classes/BasketStorage";
import { decOfNum } from "../../helper/decOfNum";
import { pageDisableScroll, pageEnableScroll } from '../../helper/pageToggleScroll';

export default function BasketContent() {
    const parent = document.querySelector('.basket');
    if (!parent) return;

    const basketList = parent.querySelector('.basket-product__list');
    const productCount = parent.querySelector('.basket-product__head-value');
    const totalPrice = parent.querySelector('.basket__price-value');
    const template = parent.querySelector('template#basket-card--template');
    const counters = document.querySelectorAll('[data-basket-value]');
    const clearBasketButton = parent.querySelector('.basket-product__head-clear');
    const submitButton = parent.querySelector('.basket__submit');

    if (!template) {
        console.error('Template for basket card is not found.');
        return;
    }

    // Функция рендеринга карточки товара корзины
    const renderBasketCard = (product) => {
        const node = template.content.cloneNode(true);
        const parent = node.querySelector('.basket-card');
        const img = node.querySelector('.basket-card__image img');
        const title = node.querySelector('.basket-card__info-title');
        const price = node.querySelector('.basket-card__info-price');
        const quantityInput = node.querySelector('input[name="basket-product"]');
        const quantityInputLabel = node.querySelector('.input-score__value');
        const removeButton = node.querySelector('[data-action="remove"]');
        const replaceButton = node.querySelector('[data-action="replace"]');

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
        quantityInput.setAttribute('value', product.quantity);
        quantityInputLabel.textContent = product.quantity;

        // Добавляем слушатель на изменение количества товара
        quantityInput.addEventListener('change', (event) => {
            requestAnimationFrame(() => {
                const newQuantity = toNumber(event.target.getAttribute('value')); // Получаем новое количество

                basketStorage.updateProductQuantity(product.id, newQuantity);
            });
        });


        // Обработчики для кнопок
        removeButton.addEventListener('click', () => {
            basketStorage.removeProduct(product.id);
        });

        replaceButton.addEventListener('click', () => {
            closeBasketHandler();
            basketStorage.removeProduct(product.id);
        });

        return node;
    };


    // Обновление корзины
    const updateBasketUI = () => {
        const products = basketStorage.getProductsDetails();

        basketList.innerHTML = ''; // Очищаем старый список

        if (isArray(products) && products.length) {
            forEach(products, product => {
                basketList.appendChild(renderBasketCard(product)); // Рендерим карточки товаров
            });
        } else {
            console.error('No products to display');
        }

        if(isEmpty(products)) {
            clearBasketButton.style.display = 'none';
        } else {
            clearBasketButton.style.display = '';
        }

        if (submitButton) {
            const canSubmit = some(products, ['inStock', true]);
            if(!canSubmit) {
                submitButton.setAttribute('disabled', 'disabled');
                submitButton.classList.add('button--disabled');
            } else {
                submitButton.removeAttribute('disabled');
                if(submitButton.classList.contains('button--disabled')) submitButton.classList.remove('button--disabled');
            }
        }
    };


    // Создание экземпляра корзины
    const basketStorage = new BasketStorage({
        onBasketUpdate: () => {
            updateBasketUI();
        },
        onProductCountChange: (count) => {
            productCount.textContent = `${count} ${decOfNum(count, ['товар', 'товара', 'товаров'])}`;

            if(!isEmpty(counters)) {
                forEach([...counters], (item) => {
                    item.dataset.basketValue = count;
                });
            }
        },
        onTotalPriceChange: (total) => {
            totalPrice.textContent = `${total} ₽`;
        },
        onRenderBasket: updateBasketUI, 
    });
    
    window.basketStorage = basketStorage;

    // Инициализация
    basketStorage.addProduct('2', 2);
    basketStorage.addProduct('21', 1);
    basketStorage.addProduct('4', 3);
    updateBasketUI(); // Рендерим корзину

    const closeBasketHandler = () => {
        if(parent.classList.contains('basket--opened')) {
            parent.classList.remove('basket--opened');
            pageEnableScroll();
        }
    }

    const openBasketHandler = () => {
        parent.classList.add('basket--opened');
        pageDisableScroll();
    };

    document.addEventListener('click', (event) => {
        if(parent.classList.contains('basket--opened')) {
            if(!parent.contains(event.target)) {
                closeBasketHandler();
            }
        }

        const openBasket = event.target.closest('.basket-action--opened');
        if(openBasket) {
            openBasketHandler();
        }

        const closeBasket = event.target.closest('.basket-action--closed');
        if(closeBasket) {
            closeBasketHandler();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeBasketHandler();
        }
    });

    clearBasketButton.addEventListener('click', () => {
        if (!isEmpty(basketStorage.products) && confirm('Вы уверены, что хотите очистить корзину?')) {
            basketStorage.clearBasket();
        }
    });
}

