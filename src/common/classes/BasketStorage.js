import axios from 'axios';
import compact from 'lodash-es/compact';
import filter from 'lodash-es/filter';
import find from 'lodash-es/find';
import isArray from 'lodash-es/isArray';
import isEmpty from 'lodash-es/isEmpty';
import isNaN from 'lodash-es/isNan';
import map from 'lodash-es/map';
import sumBy from 'lodash-es/sumBy';

export default class BasketStorage {
    constructor({ onBasketUpdate, onProductCountChange, onTotalPriceChange, onRenderBasket }) {
        this.products = []; // Список товаров в корзине (productID + quantity)
        this._products = []; // Храним все товары, полученные из API
        this._onBasketUpdate = onBasketUpdate || (() => {});
        this._onProductCountChange = onProductCountChange || (() => {});
        this._onTotalPriceChange = onTotalPriceChange || (() => {});
        this._onRenderBasket = onRenderBasket || (() => {});
    }

    // Метод для получения всех товаров
    async getProducts() {
        try {
            const response = await axios.get('./files/api/products.json'); // Пример запроса
            const data = response.data;

            if (isArray(data) && !isEmpty(data)) {
                this._products = data; // Сохраняем все товары в _products
            } else {
                console.error('No products found');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    // Метод для добавления товара в корзину
    async addProduct(productID, quantity = 1) {
        await this.getProducts();

        // Находим товар по productID
        const product = find(this._products, (product) => product.id == productID);
        if (!product) {
            console.error('Product not found');
            return;
        }

        // Проверяем, есть ли товар в корзине
        const existingProduct = find(this.products, (product) => product.productID == productID);
        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            this.products.push({ productID, quantity });
        }

        this.updateBasket();
    }

    // Метод для удаления товара из корзины
    removeProduct(productID) {
        this.products = filter(this.products, (product) => product.productID != productID);
        this.updateBasket();
    }

    // Метод для замены товара в корзине
    replaceProduct(oldProductID, newProductID) {
        this.removeProduct(oldProductID);
        this.addProduct(newProductID);
    }

    // Метод для изменения количества товара
    updateProductQuantity(productID, quantity) {
        const product = find(this.products, (product) => product.productID == productID);
        if (product) {
            if(isNaN(quantity)) {
                this.removeProduct(productID);
                return;
            }

            product.quantity = quantity;

            if (product.quantity <= 0) {
                this.removeProduct(productID);
            } else {
                this.updateBasket();
            }
        }
    }

    // Обновление данных корзины (перерисовываем и рассчитываем)
    updateBasket() {
        this._onBasketUpdate(this.products);
        const totalQuantity = sumBy(this.products, 'quantity');
        this._onProductCountChange(totalQuantity);
        this._onTotalPriceChange(this.calculateTotalPrice());
        this._onRenderBasket();

        // глобальное оповещение
        window.dispatchEvent(new CustomEvent('basket:updated', {
            detail: { products: this.products }
        }));
    }

    // Расчёт общей суммы товаров в корзине
    calculateTotalPrice() {
        return sumBy(this.products, ({ productID, quantity }) => {
            const product = find(this._products, (product) => product.id == productID); // Ищем продукт в _products

            return product ? product.price * quantity : 0;
        });
    }

    // Получить данные о товарах в корзине с полной информацией
    getProductsDetails() {
        return compact(map(this.products, ({ productID, quantity }) => {
            const product = find(this._products, (product) => product.id == productID);

            return product ? { ...product, quantity } : null;
        }));
    }

    clearBasket() {
        this.products = [];
        this.updateBasket();
    }
}
