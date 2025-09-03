<template>
    <div class="participant-card" :class="{
        'local-participant': isLocal,
        'is-active-speaker': isActiveSpeaker,
        'is-primary-speaker': isPrimarySpeaker
    }">
        <div class="participant-header">
            <h3>{{ participantName }}</h3>
            <div class="indicators">
                <ActiveSpeakerIndicator :is-active="isActiveSpeaker" :is-speaking="isSpeaking || isParticipantSpeaking"
                    :is-primary="isPrimarySpeaker" size="small" />
                <VolumeIndicator v-if="hasAudio" :volume-level="volumeLevel" :is-speaking="isSpeaking"
                    :is-muted="!hasAudio" />
            </div>
        </div>

        <!-- Видео + Аудио -->
        <div class="video-container">
            <video :ref="setVideoRef" autoplay :muted="isLocal" playsinline class="video-element"
                :class="{ 'no-video': !hasVideo }"></video>

            <!-- Скрытый аудио элемент только для удалённых -->
            <audio v-show="!isLocal && hasAudio" ref="audioRef" autoplay playsinline></audio>

            <!-- Заглушка если нет видео -->
            <div v-if="!hasVideo" class="avatar-placeholder">
                <div class="avatar-icon">
                    {{ participantName.charAt(0).toUpperCase() }}
                </div>
            </div>

            <!-- Индикаторы -->
            <div class="status-indicators">
                <div v-if="!hasAudio" class="status-icon muted">🔇</div>
                <div v-if="!hasVideo" class="status-icon no-camera">📷</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { createAudioAnalyser } from 'livekit-client'
import VolumeIndicator from './VolumeIndicator.vue'
import ActiveSpeakerIndicator from './ActiveSpeakerIndicator.vue'

const props = defineProps({
    participant: { type: Object, required: true },
    isLocal: { type: Boolean, default: false },
    videoTrack: { type: Object, default: null },
    audioTrack: { type: Object, default: null },
    isActiveSpeaker: { type: Boolean, default: false },
    isPrimarySpeaker: { type: Boolean, default: false },
    isParticipantSpeaking: { type: Boolean, default: false },
    name: { type: String, default: '' },
})

const videoRef = ref(null)
const audioRef = ref(null)

const volumeLevel = ref(0)
const isSpeaking = ref(false)
let volumeMonitor = null
let audioAnalyser = null

const participantName = computed(() =>
    props.isLocal ? `Вы (${props.name})` : props.name
)

const hasVideo = computed(() => !!props.videoTrack)
const hasAudio = computed(() => !!props.audioTrack)

const setVideoRef = (el) => (videoRef.value = el)

// ====== АУДИО ======
const attachAudioTrack = async () => {
    if (audioRef.value && props.audioTrack && !props.isLocal) {
        await nextTick()
        props.audioTrack.attach(audioRef.value)
        audioRef.value.muted = false
    }
}

const detachAudioTrack = () => {
    if (audioRef.value && props.audioTrack && !props.isLocal) {
        props.audioTrack.detach(audioRef.value)
    }
}

// ====== ВИДЕО ======
const attachVideoTrack = async () => {
    if (videoRef.value && props.videoTrack) {
        await nextTick()
        props.videoTrack.attach(videoRef.value)
    }
}

const detachVideoTrack = () => {
    if (videoRef.value && props.videoTrack) {
        props.videoTrack.detach(videoRef.value)
    }
}

// ====== Мониторинг громкости ======
const startVolumeMonitoring = () => {
    if (!props.audioTrack) return
    try {
        audioAnalyser = createAudioAnalyser(props.audioTrack)

        const updateVolume = () => {
            if (!audioAnalyser || !props.audioTrack) return

            const volume = audioAnalyser.calculateVolume()
            const volumePercent = Math.min(100, volume * 100 * 5)
            volumeLevel.value = volumePercent
            isSpeaking.value = volumePercent > 10

            volumeMonitor = requestAnimationFrame(updateVolume)
        }

        updateVolume()
    } catch (err) {
        // можно залогировать в будущем
    }
}

const stopVolumeMonitoring = () => {
    if (volumeMonitor) {
        cancelAnimationFrame(volumeMonitor)
        volumeMonitor = null
    }
    audioAnalyser = null
    volumeLevel.value = 0
    isSpeaking.value = false
}

// ====== Lifecycle ======
onMounted(async () => {
    await attachVideoTrack()
    if (props.audioTrack) {
        await attachAudioTrack()
        startVolumeMonitoring()
    }
})

onUnmounted(() => {
    detachVideoTrack()
    detachAudioTrack()
    stopVolumeMonitoring()
})

// Watchers
watch(
    () => props.videoTrack,
    async (newTrack, oldTrack) => {
        if (oldTrack) detachVideoTrack()
        if (newTrack) await attachVideoTrack()
    }
)

watch(
    () => props.audioTrack,
    async (newTrack, oldTrack) => {
        stopVolumeMonitoring()
        if (oldTrack) detachAudioTrack()

        if (newTrack) {
            await nextTick()
            await attachAudioTrack()
            startVolumeMonitoring()
        }
    }
)
</script>


<style scoped>
/* твой CSS без изменений */
</style>


<style scoped>
.participant-card {
    background-color: #1a1a1a;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    min-width: 300px;
    min-height: 200px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
}

.participant-card.local-participant {
    border-color: #007bff;
}

.participant-card.is-active-speaker {
    border-color: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.participant-card.is-primary-speaker {
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.4), 0 4px 16px rgba(168, 85, 247, 0.2);
}

.participant-header {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.indicators {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
}

.participant-header h3 {
    color: white;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 5px 10px;
    border-radius: 6px;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.video-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 200px;
}

.video-element {
    width: 100%;
    height: auto;
    border: 1px solid red;
    object-fit: cover;
    background-color: #000;
}

.video-element.no-video {
    display: none;
}

.avatar-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-icon {
    font-size: 48px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.status-indicators {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    gap: 5px;
}

.status-icon {
    background-color: rgba(0, 0, 0, 0.7);
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 14px;
}

.status-icon.muted {
    color: #f44336;
}

.status-icon.no-camera {
    color: #ff9800;
}

@media (max-width: 768px) {
    .participant-card {
        min-width: 100%;
    }

    .participant-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .participant-header h3 {
        font-size: 12px;
        padding: 4px 8px;
    }

    .avatar-icon {
        font-size: 36px;
    }
}
</style>