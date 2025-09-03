# Активный спикер - Документация

## Обзор

Добавлена система отображения активного спикера, которая использует встроенные события LiveKit для определения говорящих участников и выделения их визуально.

## Основные компоненты

### 1. `useVolumeMonitoring.js`
- Обработчики событий LiveKit: `ActiveSpeakersChanged` и `IsSpeakingChanged`
- Функции для проверки статуса спикера: `isActiveSpeaker()`, `isSpeaking()`, `getPrimarySpeaker()`
- Reactive состояние: `activeSpeakers`, `speakingParticipants`

### 2. `useParticipants.js`
- Подписка на события LiveKit для каждого участника
- Автоматическая настройка обработчиков при подключении новых участников

### 3. `ActiveSpeakerIndicator.vue`
- Визуальный компонент с анимированными волнами
- Разные состояния: активный спикер, говорящий, основной спикер
- Настраиваемые размеры и стили

### 4. `ParticipantCard.vue`
- Интеграция индикатора активного спикера
- Визуальные эффекты для разных статусов участников
- Подсветка рамки для активных спикеров

## События LiveKit

### `ActiveSpeakersChanged`
```javascript
room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
    console.log('Активные спикеры:', speakers.map(s => s.identity))
    activeSpeakers.value = speakers
})
```

### `IsSpeakingChanged`
```javascript
participant.on('isSpeakingChanged', (isSpeaking) => {
    console.log(`${participant.identity} ${isSpeaking ? 'говорит' : 'молчит'}`)
})
```

## Использование

### В шаблоне
```vue
<ParticipantCard 
    :participant="participant"
    :is-active-speaker="isActiveSpeaker(participant.identity)"
    :is-primary-speaker="getPrimarySpeaker()?.identity === participant.identity"
    :is-participant-speaking="isSpeaking(participant.identity)"
/>
```

### Получение информации
```javascript
// Основной активный спикер
const primarySpeaker = getPrimarySpeaker()

// Проверка статуса участника
const isActive = isActiveSpeaker('user123')
const speaking = isSpeaking('user123')

// Список всех активных спикеров
console.log(activeSpeakers.value)
```

## Визуальные индикаторы

### Состояния участников:
- **Обычный**: серая рамка
- **Говорящий**: зеленая рамка с индикатором
- **Активный спикер**: зеленая рамка с эффектом
- **Основной спикер**: фиолетовая рамка с увеличением

### Анимации:
- Волны звука при активности
- Плавные переходы цветов
- Масштабирование для основного спикера

## Преимущества реализации

1. **Официальные события LiveKit** - надежность и производительность
2. **Модульная архитектура** - легкость поддержки и расширения
3. **Реактивные обновления** - автоматическое обновление UI
4. **Компонентный подход** - переиспользуемые элементы
5. **Производительность** - минимальная нагрузка на систему

## Следующие шаги

- Добавление звуковых уведомлений при смене спикера
- Настройка чувствительности определения речи
- Добавление статистики активности участников
- Интеграция с записью сессий