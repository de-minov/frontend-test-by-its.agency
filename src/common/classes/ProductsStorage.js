import axios from 'axios';
import every from 'lodash-es/every';
import filter from 'lodash-es/filter';
import isArray from 'lodash-es/isArray';
import isEmpty from 'lodash-es/isEmpty';
import orderBy from 'lodash-es/orderBy';

export default class ProductsStorage {
    constructor({ onStatusChange, onProductCountChange, onProductsUpdate } = {}) {
        this.status = 'init';
        this._products = [];
        this.products = [];

        this.activeFilters = {}; // фильтры (isNew и т.д.)
        this.activeSort = null;  // сортировка (например, 'price_desc')

        this._onStatusChange = onStatusChange || (() => {});
        this._onProductCountChange = onProductCountChange || (() => {});
        this._onProductsUpdate = onProductsUpdate || (() => {});

        this._updateStatus(this.status);
    }

    _updateStatus(newStatus) {
        this.status = newStatus;
        this._onStatusChange(newStatus);
    }

    _updateProducts(list) {
        this.products = list;
        this._onProductCountChange(list.length);
        this._onProductsUpdate(list);
    }

    setFilters(filters) {
        this.activeFilters = filters;
        this.applyFiltersAndSort();
    }

    setSort(value) {
        this.activeSort = value;
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort() {
        // 1. Фильтрация
        let result = filter(this._products, product =>
            every(this.activeFilters, (val, key) => product[key] === val)
        );

        // 2. Сортировка
        const [field, dir = 'asc'] = (this.activeSort || '').split('_');
        if (field) {
            let fieldName = field;
            if (field === 'popularity') fieldName = 'purchases';
            if (field === 'date') fieldName = 'startDate';

            result = orderBy(result, [fieldName], [dir]);
        }

        this._updateProducts(result);
    }

    async getProducts() {
        if (this.status === 'loading' || this.status === 'loaded') return;

        this._updateStatus('loading');

        try {
            const response = await axios.get('./files/api/products.json');
            const data = response.data;

            if (isArray(data) && !isEmpty(data)) {
                this._products = data;
                this.applyFiltersAndSort(); // фильтрация + сортировка
                this._updateStatus('loaded');
            } else {
                this._products = [];
                this._updateProducts([]);
                this._updateStatus('empty');
            }
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this._updateStatus('error');
        }
    }
}
