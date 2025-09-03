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
            <p>👥 Участников: {{ participants.length + 1 }}</p>
            <p v-if="participants.length > 0">
                📹 Активных видео: {{ remoteTracks?.length || 0 }}
            </p>
            <p v-if="getPrimarySpeaker()" class="active-speaker-info">
                🎤 {{ getPrimarySpeaker().identity }}
            </p>
        </div>

        <!-- Основная область видео -->
        <div v-if="connected" class="video-container">
            <!-- Шаринг экрана локального участника -->
            <ScreenShareCard v-if="localScreenTrack" :participant="room.localParticipant"
                :screen-track="localScreenTrack" :is-local="true" />

            <!-- Шаринг экрана удалённых участников -->
            <ScreenShareCard v-for="participant in participants" :key="participant.sid + '_screen'"
                :participant="participant" :screen-track="getParticipantScreenTrack(participant)"
                v-if="getParticipantScreenTrack(participant)" :is-local="false" />

            <!-- Локальный участник -->
            <ParticipantCard v-if="room && room.localParticipant" :participant="room.localParticipant" :is-local="true"
                :video-track="localVideoTrack" :audio-track="localAudioTrack"
                :is-active-speaker="isActiveSpeaker('local')"
                :is-primary-speaker="getPrimarySpeaker()?.identity === room.localParticipant.identity"
                :is-participant-speaking="isLocalSpeaking" class="local-participant-card" />

            <!-- Удалённые участники -->
            <ParticipantCard v-for="participant in participants" :key="participant.sid" :participant="participant"
                :is-local="false" :video-track="getParticipantVideoTrack(participant)"
                :audio-track="getParticipantAudioTrack(participant)"
                :is-active-speaker="isActiveSpeaker(participant.identity)"
                :is-primary-speaker="getPrimarySpeaker()?.identity === participant.identity"
                :is-participant-speaking="isSpeaking(participant.identity)" />
        </div>

        <!-- Панель управления внизу -->
        <div class="controls">
            <div v-if="!connected">
                <p class="room-title">Подключение к комнате {{ roomName }}</p>
                <input v-model="userName" placeholder="Введите ваше имя" />

                <button @click="requestMediaPermissions" class="permission-btn">
                    🎤 Разрешить доступ к микрофону
                </button>
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
                <button @click="toggleScreenShare" :class="{ active: isScreenSharing, 'screen-share': true }">
                    {{ isScreenSharing ? '🛑 Остановить показ экрана' : '📺 Поделиться экраном' }}
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
import ScreenShareCard from '~/components/ScreenShareCard.vue'
import { useRoomLogic } from '~/composables/useRoomLogic'

const route = useRoute()
const roomName = route.params.id

definePageMeta({
    middleware: 'auth'
})

const {
    room, connected, connecting, error, playbackBlocked, userName,
    localVideoTrack, localAudioTrack, localScreenTrack, isScreenSharing,
    participants, activeSpeakers,
    localVolumeLevel, isLocalSpeaking, isActiveSpeaker, isSpeaking,
    getPrimarySpeaker, getParticipantVideoTrack, getParticipantAudioTrack, getParticipantScreenTrack, getLocalScreenTrack,
    requestMediaPermissions, onDeviceChanged, joinRoom, leaveRoom,
    toggleCamera, toggleMicrophone, toggleScreenShare, tryEnablePlayback, cleanup
} = useRoomLogic(roomName)

onMounted(() => {
    console.log('🏠 Комната инициализирована:', roomName)
})

onUnmounted(() => {
    cleanup()
})
</script>
