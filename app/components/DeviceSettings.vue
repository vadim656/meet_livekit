<template>
    <div class="device-settings">
        <button @click="isOpen = !isOpen" class="settings-btn">
            ⚙️ Устройства
        </button>

        <div v-if="isOpen" class="settings-panel">
            <div class="device-group">
                <label>🎥 Камера:</label>
                <select v-model="selectedVideoDevice" @change="onVideoChange">
                    <option value="">Выключить камеру</option>
                    <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
                        {{ device.label || `Камера ${device.deviceId.slice(0, 8)}...` }}
                    </option>
                </select>
            </div>

            <div class="device-group">
                <label>🎤 Микрофон:</label>
                <select v-model="selectedAudioDevice" @change="onAudioChange">
                    <option value="">Выключить микрофон</option>
                    <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
                        {{ device.label || `Микрофон ${device.deviceId.slice(0, 8)}...` }}
                    </option>
                </select>
            </div>

            <button @click="refreshDevices" class="refresh-btn">
                🔄 Обновить
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['device-changed'])

const isOpen = ref(false)
const videoDevices = ref([])
const audioDevices = ref([])
const selectedVideoDevice = ref('')
const selectedAudioDevice = ref('')

const refreshDevices = async () => {
    try {
        // Запрашиваем разрешения для получения labels
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        stream.getTracks().forEach(track => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()

        videoDevices.value = devices.filter(device => device.kind === 'videoinput')
        audioDevices.value = devices.filter(device => device.kind === 'audioinput')

        console.log('📱 Найдено устройств:', {
            video: videoDevices.value.length,
            audio: audioDevices.value.length
        })

        // Автовыбор первых устройств
        if (!selectedVideoDevice.value && videoDevices.value.length > 0) {
            selectedVideoDevice.value = videoDevices.value[0].deviceId
        }
        if (!selectedAudioDevice.value && audioDevices.value.length > 0) {
            const defaultDevice = audioDevices.value.find(d => d.deviceId === 'default') || audioDevices.value[0]
            selectedAudioDevice.value = defaultDevice.deviceId
        }
    } catch (err) {
        console.error('Ошибка получения устройств:', err)
    }
}

const onVideoChange = () => {
    emit('device-changed', { type: 'video', deviceId: selectedVideoDevice.value })
}

const onAudioChange = () => {
    emit('device-changed', { type: 'audio', deviceId: selectedAudioDevice.value })
}

onMounted(() => {
    refreshDevices()
})
</script>

<style scoped>
.device-settings {
    position: relative;
    display: inline-block;
}

.settings-btn {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
    color: white !important;
    border: none;
    padding: 12px 20px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.settings-btn:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
}

.settings-panel {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    min-width: 280px;
    margin-top: 10px;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

.device-group {
    margin-bottom: 20px;
}

.device-group:last-child {
    margin-bottom: 15px;
}

.device-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #e2e8f0;
    font-size: 14px;
}

.device-group select {
    width: 100%;
    padding: 12px 16px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 40px;
}

.device-group select:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: rgba(30, 41, 59, 0.9);
}

.device-group select option {
    background: #1e293b;
    color: #ffffff;
    padding: 8px;
}

.refresh-btn {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
    color: white !important;
    border: none;
    padding: 12px 20px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    width: 100%;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
}

.refresh-btn:hover {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(6, 182, 212, 0.4);
}

.refresh-btn:active {
    transform: translateY(0);
}

/* Стрелка указывающая на кнопку */
.settings-panel::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: none;
    border-right: none;
    transform: translateX(-50%) rotate(45deg);
    backdrop-filter: blur(20px);
}

@media (max-width: 768px) {
    .settings-panel {
        left: 0;
        right: 0;
        transform: none;
        margin: 10px;
        width: auto;
        min-width: auto;
    }

    .settings-panel::before {
        left: 20px;
        transform: rotate(45deg);
    }
}
</style>