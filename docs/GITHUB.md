# Як викласти проєкт на GitHub

Є три способи — оберіть один.

## Спосіб 1. PyCharm (найпростіший)

1. Розпакуйте архів і відкрийте папку `blooma-fire-radar` у PyCharm (**File → Open**).
2. Перевірте, що все працює: правою кнопкою на `run.py` → **Run 'run'**, потім на папці `tests` → **Run 'Python tests in tests'**.
3. **Git → GitHub → Share Project on GitHub** (у старих версіях — **VCS → Share Project on GitHub**).
4. Назва репозиторію: `blooma-fire-radar`. **Зніміть галочку «Private»**, щоб репозиторій був публічним.
5. У вікні вибору файлів залиште все, крім `.idea` (він і так у `.gitignore`), → **Add**.

## Спосіб 2. Сайт GitHub (без git)

1. <https://github.com/new> → назва `blooma-fire-radar` → **Public** → нічого не додавайте (без README, .gitignore і ліцензії — вони вже є) → **Create repository**.
2. Натисніть **uploading an existing file** і перетягніть **вміст** папки (не саму папку).
3. Приховані папки `.github` і файл `.gitignore` через перетягування можуть не завантажитися. Тоді створіть їх вручну: **Add file → Create new file**, назва `.github/workflows/tests.yml`, вставте вміст файлу.
4. **Commit changes**.

## Спосіб 3. Командний рядок

```bash
cd blooma-fire-radar
git init
git add .
git commit -m "Blooma: Пожежний радар і Кола спеки"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГІН/blooma-fire-radar.git
git push -u origin main
```

## Після завантаження

- [ ] Відкрийте репозиторій — README має показатися на головній сторінці зі скриншотом і схемою.
- [ ] Вкладка **Actions** → має бути зелена галочка `tests` (тести на Windows і Linux).
- [ ] Праворуч **About → ⚙**: опис `Wildfire danger radar and neighbour heat-care circles for Ukraine`, теми `wildfire`, `heatwave`, `climate`, `ukraine`, `python`.
- [ ] Заповніть у README розділи **Автори** й **Використання ШІ** (що ви робили самі).
- [ ] Додайте посилання на відео на початок README, наприклад: `Відео-демо: https://youtu.be/...`.
- [ ] Замініть скриншоти в `docs/screenshots/` власними — у вас підвантажиться фон карти OpenStreetMap.
- [ ] **Ніколи** не додавайте в репозиторій ключ `FIRMS_MAP_KEY`.
