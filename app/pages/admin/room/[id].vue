<template>
    <div class="video-chat-container">
        <!-- Заголовок -->
        <h1>🎥 {{ roomName }}</h1>

        <!-- Ошибки -->
        <div v-if="error" class="error-message">
            {{ error }}
        </div>

        <!-- Информация о комнате (справа вверху) -->
        <div v-if="connected" class="room-info">
            <p>👥 Участников: {{ participants?.length + 1 }}</p>
            <p v-if="participants?.length > 0">
                📹 Активных видео: {{ remoteTracks?.length }}
            </p>
            <p v-if="getPrimarySpeaker()" class="active-speaker-info">
                🎤 {{ getPrimarySpeaker().identity }}
            </p>
        </div>

        <!-- Основная область видео -->
        <div v-if="connected" class="video-container">
            <!-- Локальный участник -->
            <ParticipantCard v-if="room && room.localParticipant" :participant="room.localParticipant" :is-local="true"
                :video-track="localVideoTrack" :audio-track="localAudioTrack"
                :is-active-speaker="isActiveSpeaker('local')" :name="user.Name || 'test'"
                :is-primary-speaker="getPrimarySpeaker()?.identity === room.localParticipant.identity"
                :is-participant-speaking="isLocalSpeaking" class="local-participant-card" />

            <!-- Удалённые участники -->
            <ParticipantCard v-for="participant in participants" :key="participant.sid" :participant="participant"
                :is-local="false" :video-track="getParticipantVideoTrack(participant)"
                :audio-track="getParticipantAudioTrack(participant)" :name="user.Name || 'test'"
                :is-active-speaker="isActiveSpeaker(participant.identity)"
                :is-primary-speaker="getPrimarySpeaker()?.identity === participant.identity"
                :is-participant-speaking="isSpeaking(participant.identity)" />
        </div>

        <!-- Панель управления внизу -->
        <div class="controls">
            <div v-if="!connected">

                <input v-model="userName" placeholder="Введите ваше имя" />

                <!-- <button @click="requestMediaPermissions" class="permission-btn">
                    🎤 Разрешить доступ к микрофону
                </button> -->
                <button @click="joinRoom" :disabled="connecting">
                    {{ connecting ? '⏳ Подключение...' : '🚀 Подключиться' }}
                </button>
            </div>

            <div v-else class="media-controls">
                <button @click="toggleCamera" :class="{ active: localVideoTrack }">
                    {{ localVideoTrack ? '📹 Камера вкл' : '📹 Камера выкл' }}
                </button>
                <button @click="toggleMicrophone" :class="{ active: localAudioTrack }">
                    {{ localAudioTrack ? '🎤 Микрофон вкл' : '🎤 Микрофон выкл' }}
                </button>

                <!-- Индикатор громкости -->
                <VolumeIndicator v-if="localAudioTrack" :volume-level="localVolumeLevel" :is-speaking="isLocalSpeaking"
                    :is-muted="!localAudioTrack" class="local-volume-indicator" />

                <!-- Смена устройств -->
                <DeviceSettings @device-changed="onDeviceChanged" />

                <!-- Уведомление о блокировке звука -->
                <div v-if="playbackBlocked" class="hint">
                    🔇 Браузер заблокировал воспроизведение звука
                    <button @click="tryEnablePlayback">Разрешить</button>
                </div>

                <button @click="leaveRoom" class="leave-btn">❌ Покинуть комнату</button>
            </div>
        </div>
    </div>
</template>
<script setup>
import { onMounted, onUnmounted } from 'vue'
import ParticipantCard from '~/components/ParticipantCard.vue'
import VolumeIndicator from '~/components/VolumeIndicator.vue'
import DeviceSettings from '~/components/DeviceSettings.vue'
import { useRoomLogic } from '~/composables/useRoomLogic'
import API from "~/composables/api";
import useNotifi from "~/composables/useNotifi";
const apiServer = new API()

const user = useStrapiUser()
const route = useRoute()
const roomName = ref('')


const toast = useNotifi()

const {
    room, connected, connecting, error, playbackBlocked, userName,
    localVideoTrack, localAudioTrack, participants, activeSpeakers,
    localVolumeLevel, isLocalSpeaking, isActiveSpeaker, isSpeaking,
    getPrimarySpeaker, getParticipantVideoTrack, getParticipantAudioTrack,
    requestMediaPermissions, onDeviceChanged, joinRoom: originalJoinRoom, leaveRoom,
    toggleCamera, toggleMicrophone, tryEnablePlayback, cleanup
} = useRoomLogic(roomName)

// Создаем обертку для joinRoom, чтобы передать email пользователя
const joinRoom = () => {
    const userEmail = user.value?.email || user.value?.Email
    console.log('👤 Данные пользователя:', {
        userEmail,
        userName: userName.value,
        roomName: roomName.value,
        userFields: {
            Name: user.value?.Name,
            email: user.value?.email,
            Email: user.value?.Email,
            id: user.value?.id
        }
    })

    if (!userEmail) {
        console.error('❌ Email пользователя не найден!')
        toast.showSuccess('Ошибка: Email пользователя не найден')
        return
    }

    if (!roomName.value) {
        console.error('❌ Название комнаты не найдено!')
        toast.showSuccess('Ошибка: Название комнаты не найдено')
        return
    }

    return originalJoinRoom(userEmail)
}

const activeMeet = ref(true)
const themeConf = ref('')

const userNameStrapi = user.value.Name

// Устанавливаем userName из user.value.Name
if (user.value?.Name) {
    userName.value = user.value.Name
}

// Вспомогательная функция для безопасного логирования реактивных объектов
const safeStringify = (obj, maxDepth = 2) => {
    const seen = new WeakSet()
    return JSON.stringify(obj, (key, val) => {
        if (val != null && typeof val === 'object') {
            if (seen.has(val)) return '[Circular]'
            seen.add(val)
        }
        return val
    })
}

// Функция для проверки доступности сервера токенов
const checkTokenServerAvailability = async () => {
    try {
        console.log('🔍 Проверяем доступность сервера токенов...')
        const response = await fetch('http://localhost:1337/api/token', {
            method: 'OPTIONS'
        })
        console.log('✅ Сервер токенов доступен')
        return true
    } catch (error) {
        console.error('❌ Сервер токенов недоступен:', error)
        toast.showSuccess('Ошибка: Сервер аутентификации недоступен на http://localhost:1337')
        return false
    }
}

function getRoom() {
    apiServer.getRoomActive(route.params.id).then(res => {
        if (res?.data) {
            console.log('✅ Комната найдена:', {
                roomId: route.params.id,
                isActive: res.data.Active,
                roomName: res.data.Name
            })
            activeMeet.value = res.data.Active
            roomName.value = res.data.Name
        } else {
            console.warn('⚠️ Комната не найдена:', route.params.id)
            toast.showSuccess("Конференции не существует!");
        }
    }).catch((error) => {
        console.error('❌ Ошибка получения комнаты:', error.message || error)
        activeMeet.value = false
        toast.showSuccess("Конференции не существует!");
    })
}


onMounted(() => {
    console.log('🏠 Комната инициализирована:', roomName)

    // Проверяем доступность сервера токенов при загрузке
    // checkTokenServerAvailability()

    getRoom()
})

onUnmounted(() => {
    cleanup()
})
</script>
