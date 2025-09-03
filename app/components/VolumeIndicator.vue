<template>
    <div class="volume-indicator" :class="{ 'speaking': isSpeaking, 'muted': isMuted }">
        <div class="volume-icon">
            <span v-if="isMuted">🔇</span>
            <span v-else-if="isSpeaking">🔊</span>
            <span v-else>🔉</span>
        </div>
        <div class="volume-meter">
            <div class="volume-bar" :style="{ width: volumeLevel + '%' }"></div>
        </div>
        <div class="volume-text">{{ Math.round(volumeLevel) }}%</div>
    </div>
</template>

<script setup>
const props = defineProps({
    volumeLevel: {
        type: Number,
        default: 0
    },
    isSpeaking: {
        type: Boolean,
        default: false
    },
    isMuted: {
        type: Boolean,
        default: false
    }
})
</script>

<style scoped>
.volume-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    transition: all 0.3s ease;
    min-width: 120px;
}

.volume-indicator.speaking {
    background-color: rgba(76, 175, 80, 0.8);
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);
}

.volume-indicator.muted {
    background-color: rgba(244, 67, 54, 0.8);
}

.volume-icon {
    font-size: 16px;
    min-width: 20px;
    text-align: center;
}

.volume-meter {
    flex: 1;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    overflow: hidden;
}

.volume-bar {
    height: 100%;
    background: linear-gradient(90deg, #4caf50, #8bc34a, #ffeb3b, #ff9800, #f44336);
    border-radius: 3px;
    transition: width 0.1s ease;
    min-width: 2px;
}

.volume-text {
    font-size: 11px;
    color: white;
    font-weight: 600;
    min-width: 35px;
    text-align: right;
}
</style>