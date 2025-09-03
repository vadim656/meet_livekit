# Быстрая настройка токена для тестирования

Чтобы протестировать видео чат, вам нужен рабочий токен от LiveKit сервера.

## Вариант 1: Использование LiveKit Cloud (рекомендуется)

1. Перейдите на https://cloud.livekit.io/
2. Создайте аккаунт и проект
3. Получите API Key и Secret
4. Используйте LiveKit CLI для генерации токена:

```bash
# Установите LiveKit CLI
npm install -g @livekit/cli

# Сгенерируйте токен (замените на ваши данные)
livekit-cli create-token \
  --api-key your_api_key \
  --api-secret your_api_secret \
  --identity user1 \
  --room test \
  --valid-for 24h
```

5. Скопируйте полученный токен
6. В файле `useLiveKit.js` замените функцию `getDevToken`:

```javascript
function getDevToken(roomName, identity) {
    // Вставьте ваш токен здесь
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // ваш токен
}
```

7. Обновите URL сервера на ваш LiveKit Cloud URL:

```javascript
await room.value.connect('wss://your-project.livekit.cloud', accessToken)
```

## Вариант 2: Локальный LiveKit сервер

1. Запустите локальный LiveKit сервер используя Docker:

```bash
docker run --rm -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -e LIVEKIT_KEYS="devkey: devsecret" \
  livekit/livekit-server \
  --dev
```

2. Используйте встроенные dev ключи:

```javascript
// В useLiveKit.js - для DEV сервера только!
import { AccessToken } from 'livekit-server-sdk'

function getDevToken(roomName, identity) {
    const at = new AccessToken('devkey', 'devsecret', { identity })
    at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true })
    return at.toJwt()
}
```

3. Установите server SDK:

```bash
npm install livekit-server-sdk
```

4. Обновите URL на локальный сервер:

```javascript
await room.value.connect('ws://localhost:7880', accessToken)
```

## После настройки

1. Перезапустите dev сервер: `npm run dev`
2. Откройте http://localhost:3000
3. Перейдите на страницу "Начать видео чат"
4. Разрешите доступ к камере и микрофону
5. Нажмите "Подключиться"

## Тестирование с несколькими участниками

Откройте в нескольких вкладках браузера или на разных устройствах с тем же URL для тестирования многопользовательского чата.