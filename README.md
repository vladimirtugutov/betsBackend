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
