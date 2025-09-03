<template>
    <div class="screen-share-card">
        <div class="screen-share-header">
            <h3>🖥️ {{ participantName }} поделился экраном</h3>
        </div>

        <div class="screen-container">
            <video :ref="setVideoRef" autoplay playsinline class="screen-video" muted></video>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
    participant: { type: Object, required: true },
    screenTrack: { type: Object, required: true },
    isLocal: { type: Boolean, default: false }
})

const videoRef = ref(null)

const participantName = computed(() =>
    props.isLocal ? `Вы` : props.participant.identity
)

const setVideoRef = (el) => (videoRef.value = el)

const attachScreenTrack = async () => {
    if (videoRef.value && props.screenTrack) {
        await nextTick()
        props.screenTrack.attach(videoRef.value)
        console.log(`🖥️ Прикреплён трек шаринга экрана для ${props.participant.identity}`)
    }
}

const detachScreenTrack = () => {
    if (videoRef.value && props.screenTrack) {
        props.screenTrack.detach(videoRef.value)
    }
}

onMounted(async () => {
    await attachScreenTrack()
})

onUnmounted(() => {
    detachScreenTrack()
})

watch(
    () => props.screenTrack,
    async (newTrack, oldTrack) => {
        if (oldTrack) detachScreenTrack()
        if (newTrack) await attachScreenTrack()
    }
)
</script>

<style scoped>
.screen-share-card {
    background-color: #1a1a1a;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    border: 3px solid #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    grid-column: 1 / -1;
    /* Занимает всю ширину сетки */
    max-height: 70vh;
}

.screen-share-header {
    position: absolute;
    top: 15px;
    left: 15px;
    z-index: 2;
}

.screen-share-header h3 {
    color: white;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    padding: 10px 16px;
    border-radius: 12px;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
}

.screen-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.screen-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: #000;
}

@media (max-width: 768px) {
    .screen-share-card {
        min-height: 300px;
        max-height: 60vh;
    }

    .screen-container {
        min-height: 300px;
    }

    .screen-share-header h3 {
        font-size: 14px;
        padding: 8px 12px;
    }
}
</style>