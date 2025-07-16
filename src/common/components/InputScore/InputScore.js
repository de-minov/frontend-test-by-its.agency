import isFinite from 'lodash-es/isFinite';
import toNumber from 'lodash-es/toNumber';

export default function InputScore() {
    document.addEventListener('click', (event) => {
        const target = event.target.closest('.input-score__button');
        if (!target) return;

        const parent = target.closest('.input-score');
        const input = parent.querySelector('.input-score__input-hidden');
        const display = parent.querySelector('.input-score__value');

        if (!input || !display) return;

        const step = toNumber(input.dataset.step) || 1;
        const minAttr = input.dataset.min;
        const maxAttr = input.dataset.max;

        const hasMin = isFinite(toNumber(minAttr));
        const hasMax = isFinite(toNumber(maxAttr));
        const min = hasMin ? toNumber(minAttr) : null;
        const max = hasMax ? toNumber(maxAttr) : null;

        const isClear = input.dataset.isClear !== undefined;
        const isStart = input.dataset.isStart !== undefined;

        let rawValue = input.getAttribute('value');
        let currentValue;

        // Инициализация значения
        if (input.disabled && rawValue === 'deleted') {
            input.disabled = false;
            currentValue = hasMin ? min : 0;
        } else {
            const parsed = toNumber(rawValue);
            currentValue = isFinite(parsed) ? parsed : 0;
        }

        // Обработка нажатия на кнопки
        if (target.classList.contains('input-score__button--plus')) {
            currentValue += step;
        } else if (target.classList.contains('input-score__button--minus')) {
            currentValue -= step;
        }

        // Ограничения по min/max
        if (hasMin) currentValue = Math.max(currentValue, min);
        if (hasMax) currentValue = Math.min(currentValue, max);

        // Очистка
        if (
            isClear &&
            hasMin &&
            currentValue <= min &&
            target.classList.contains('input-score__button--minus')
        ) {
            input.setAttribute('value', 'deleted');
            input.disabled = true;
            display.textContent = '0';
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        // Устанавливаем новые значения
        input.setAttribute('value', currentValue);
        display.textContent = currentValue.toString();
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Скрываем/показываем кнопку "минус"
        if (isStart && hasMin) {
            if(currentValue > min) {
                if(parent.classList.contains('input-score--hidden-controls')) {
                    parent.classList.remove('input-score--hidden-controls');
                }
            } else {
                parent.classList.add('input-score--hidden-controls');
            }
        }
    });
}
