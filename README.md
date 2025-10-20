### env
- cp .env.example .env
- ENCRYPTION_KEY можно сгенерировать с помощью:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

---

### Запуск
#### 1) через докер
```bash
docker compose up --build -d
```

#### 2) стандартный способ
```bash
npm i
npm run migrate:deploy
npm run generate
npm run seed
npm run build
npm run prod
```
---

### Команды

| Скрипт                   | Описание         |
| ------------------------ | ---------------- |
| `npm run build`          | билд проекта     |
| `npm run prod`           | запуск на проде  |
| `npm run generate`       | генерация призмы |
| `npm run seed`           | сиды             |
| `npm run migrate:dev`    | миграции дев     |
| `npm run migrate:deploy` | миграции прод    |
| `npm run reset`          | Сброс базы       |

