import { pageEnableScroll, pageToggleScroll } from '../../helper/pageToggleScroll';

export default function InputSelect() {
    document.addEventListener('click', (event) => {
        const target = event.target;

        // Открытие/закрытие выпадающего списка
        if (target.closest('.input-select__label')) {
            const parent = target.closest('.input-select');
            const input = parent.querySelector('.input-select__input-hidden');
            const drop = parent.querySelector('.input-select__drop');

            if (!input || !drop) return;

            const isOpen = drop.classList.toggle('input-select__drop--dropped');
            if (isOpen) {
                pageToggleScroll();
                document.addEventListener('click', handleClickOutside);
                document.addEventListener('keydown', handleEscPress);
            } else {
                closeDrop();
            }
        }

        // Обработка клика по элементу в выпадающем списке
        if (target.closest('.input-select__drop-item')) {
            const parent = target.closest('.input-select');
            const input = parent.querySelector('.input-select__input-hidden');
            const drop = parent.querySelector('.input-select__drop');
            const label = parent.querySelector('.input-select__label');
            const labelText = label.querySelector('span');

            if (!input || !drop || !labelText) return;

            const selectedItem = target.closest('.input-select__drop-item');
            if (!selectedItem) return;

            const oldActive = drop.querySelector('.input-select__drop-item--selected');
            if (oldActive) oldActive.classList.remove('input-select__drop-item--selected');

            selectedItem.classList.add('input-select__drop-item--selected');
            input.value = selectedItem.dataset.value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            labelText.textContent = selectedItem.textContent;

            closeDrop();
        }

        // Функция закрытия выпадающего списка
        function closeDrop() {
            const openDrop = document.querySelector('.input-select__drop--dropped');
            if (openDrop) {
                openDrop.classList.remove('input-select__drop--dropped');
            }
            pageEnableScroll();
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscPress);
        }

        // Обработчик клика вне выпадающего списка для его закрытия
        function handleClickOutside(e) {
            const parent = e.target.closest('.input-select');
            if (!parent || !parent.contains(e.target)) {
                closeDrop();
            }
        }

        // Обработчик нажатия клавиши ESC для закрытия выпадающего списка
        function handleEscPress(e) {
            if (e.key === 'Escape') {
                closeDrop();
            }
        }
    });
}
