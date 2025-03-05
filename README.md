# 🏆 Betting Integration API

API-сервис для интеграции с платформой ставок.  
Сервис выступает промежуточным слоем между клиентскими приложениями и внешним Betting Provider API.

📌 **Документация API**:  
[![Betting API](https://img.shields.io/badge/API%20Docs-ReadMe-blue)](https://bettingintegrationapi.readme.io/reference/post_auth-login#/)

## 🚀 Особенности

✅ Поддержка JWT-аутентификации  
✅ Работа со ставками (создание, просмотр, рекомендации)  
✅ API для обновления баланса  
✅ Интеграция с внешним провайдером ставок

---

## 📖 Документация API

Полная документация доступна по ссылке:  
🔗 **[API Reference](https://bettingintegrationapi.readme.io/reference/post_auth-login#/)**

### 🔑 Аутентификация

Для работы с API требуется аутентификация через JWT-токен.  
**Запрос**:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user1"
}
```

⚙ Инструкция по запуску приложения
1. Создай или помести .env-файл в корень проекта.
(Убедись, что все переменные окружения заполнены корректно.)
2. Запусти контейнеры через Docker Compose:
```sh
docker-compose up -d
```

3. Проверь состояние контейнеров:

```sh
docker ps
```

```sh
docker logs betting_api
```

🗂 Коллекция запросов для Postman
В корне проекта находится файл:
akBackend.postman_collection.json
С его помощью можно протестировать работоспособность приложения в Postman.

Команды для запуска тестов:
установка зависимостей
```sh
yarn install
```

запуск jest
```sh
yarn jest
```
очистить кэш тестов
```sh
yarn jest --clearCashe
```
