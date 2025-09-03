# LiveKit Video Chat - Минимальная версия

Простое приложение для видео чата на основе LiveKit и Nuxt.js.

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите сервер разработки:
```bash
npm run dev
```

3. Откройте http://localhost:3000 в браузере

## Настройка для продакшена

### 1. Настройка LiveKit сервера

Для работы приложения вам нужен LiveKit сервер. Варианты:

- **LiveKit Cloud**: https://cloud.livekit.io/ (самый простой)
- **Self-hosted**: https://docs.livekit.io/realtime/self-hosting/

### 2. Настройка токенов

⚠️ **ВАЖНО**: Текущая реализация использует клиентскую генерацию токенов только для демонстрации. В продакшене токены ДОЛЖНЫ генерироваться на сервере!

#### Обновите `useLiveKit.js`:

```javascript
// Замените функцию getDevToken на запрос к вашему серверу
async function getDevToken(roomName, identity) {
    const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName, identity }),
    })
    
    const data = await response.json()
    return data.token
}
```

#### Создайте серверный endpoint (например, `server/api/token.post.js`):

```javascript
import { AccessToken } from 'livekit-server-sdk'

export default defineEventHandler(async (event) => {
    const { roomName, identity } = await readBody(event)
    
    // Ваши учетные данные LiveKit
    const API_KEY = process.env.LIVEKIT_API_KEY
    const API_SECRET = process.env.LIVEKIT_API_SECRET
    
    const at = new AccessToken(API_KEY, API_SECRET, { identity })
    at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true })
    
    return { token: at.toJwt() }
})
```

### 3. Обновите URL сервера

В файле `useLiveKit.js` замените:
```javascript
await room.value.connect('wss://realtor.baza.expert/livekit', accessToken)
```

На ваш LiveKit сервер:
```javascript
await room.value.connect('wss://your-livekit-server.com', accessToken)
```

### 4. Переменные окружения

Создайте файл `.env`:
```
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WS_URL=wss://your-livekit-server.com
```

## Возможности

- ✅ Подключение к комнатам LiveKit
- ✅ Включение/выключение камеры и микрофона
- ✅ Отображение локального и удаленных видео
- ✅ Обработка подключения и отключения участников
- ✅ Адаптивный интерфейс
- ✅ Обработка ошибок

## Архитектура

```
app/
├── composables/
│   └── useLiveKit.js     # Основная логика LiveKit
├── pages/
│   ├── index.vue         # Главная страница
│   └── live.vue          # Страница видео чата
└── app.vue               # Корневой компонент
```

## Технологии

- **Nuxt.js 4** - Full-stack фреймворк
- **Vue 3** - Реактивный UI
- **LiveKit Client SDK** - WebRTC и медиа
- **TypeScript** - Типизация

## Разработка

### Добавление новых функций

1. **Чат сообщения**: Используйте `room.localParticipant.publishData()`
2. **Запись**: Интегрируйте LiveKit Egress
3. **Модерация**: Добавьте права доступа в токены
4. **Уведомления**: Слушайте события комнаты

### Отладка

Включите логи LiveKit:
```javascript
import { setLogLevel, LogLevel } from 'livekit-client'
setLogLevel(LogLevel.debug)
```

## Известные ограничения

- Нет персистентного хранения комнат
- Базовая обработка ошибок
- Нет аутентификации пользователей
- Простой UI без продвинутых функций

## Дополнительные ресурсы

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Client SDK](https://github.com/livekit/client-sdk-js)
- [Nuxt.js Documentation](https://nuxt.com/)