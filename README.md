# Frontend Test by its.agency

Сборка на Gulp + Pug + SCSS + Rollup для вёрстки и автоматической публикации на GitHub Pages.

## 🚀 Демо

**[Открыть страницу](https://de-minov.github.io/frontend-test-by-its.agency/)**

## 📁 Структура проекта

```
├─ src/                # Исходники (pug, scss, js, компоненты)
├─ htdocs/             # Сборка (игнорируется в git)
├─ gulpfile.mjs        # Gulp конфигурация
├─ package.json
└─ .gitignore
```

## 📦 Установка

```bash
yarn
```

## 🛠️ Команды

| Команда        | Описание                                          |
|----------------|---------------------------------------------------|
| `yarn dev`     | Запуск dev-сервера + файловый watch               |
| `yarn build`   | Сборка проекта в папку `htdocs/`                  |
| `yarn deploy`  | Сборка + деплой в ветку `gh-pages` (GitHub Pages) |
