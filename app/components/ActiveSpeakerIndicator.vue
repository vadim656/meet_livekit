<template>
    <div class="active-speaker-indicator" :class="{
        'is-active': isActive,
        'is-speaking': isSpeaking,
        'is-primary': isPrimary
    }">
        <!-- Иконка микрофона -->
        <div class="speaker-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path
                    d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
        </div>

        <!-- Анимированные волны -->
        <div v-if="isActive" class="sound-waves">
            <div class="wave wave-1"></div>
            <div class="wave wave-2"></div>
            <div class="wave wave-3"></div>
        </div>

        <!-- Текстовая метка (опционально) -->
        <span v-if="showLabel" class="speaker-label">
            {{ isPrimary ? 'Основной спикер' : 'Говорит' }}
        </span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    // Активен ли спикер
    isActive: {
        type: Boolean,
        default: false
    },
    // Говорит ли участник
    isSpeaking: {
        type: Boolean,
        default: false
    },
    // Основной активный спикер
    isPrimary: {
        type: Boolean,
        default: false
    },
    // Показывать текстовую метку
    showLabel: {
        type: Boolean,
        default: false
    },
    // Размер индикатора
    size: {
        type: String,
        default: 'medium', // small, medium, large
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
})

// Computed классы для размера
const sizeClasses = computed(() => ({
    [`size-${props.size}`]: true
}))
</script>

<style scoped>
.active-speaker-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
}

/* Размеры */
.active-speaker-indicator.size-small {
    padding: 2px 6px;
    gap: 4px;
}

.active-speaker-indicator.size-small .speaker-icon {
    width: 12px;
    height: 12px;
}

.active-speaker-indicator.size-medium {
    padding: 4px 8px;
    gap: 6px;
}

.active-speaker-indicator.size-medium .speaker-icon {
    width: 16px;
    height: 16px;
}

.active-speaker-indicator.size-large {
    padding: 6px 12px;
    gap: 8px;
}

.active-speaker-indicator.size-large .speaker-icon {
    width: 20px;
    height: 20px;
}

/* Состояния */
.active-speaker-indicator.is-speaking {
    background: rgba(34, 197, 94, 0.2);
    color: #16a34a;
    border: 1px solid rgba(34, 197, 94, 0.3);
}

.active-speaker-indicator.is-active {
    background: rgba(59, 130, 246, 0.2);
    color: #2563eb;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.active-speaker-indicator.is-primary {
    background: rgba(168, 85, 247, 0.2);
    color: #7c3aed;
    border: 1px solid rgba(168, 85, 247, 0.3);
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1);
}

/* Иконка микрофона */
.speaker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
}

.is-speaking .speaker-icon,
.is-active .speaker-icon {
    transform: scale(1.1);
}

/* Анимированные волны */
.sound-waves {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 16px;
}

.wave {
    width: 2px;
    background: currentColor;
    border-radius: 1px;
    animation: wave-animation 1.5s ease-in-out infinite;
}

.wave-1 {
    height: 40%;
    animation-delay: 0s;
}

.wave-2 {
    height: 80%;
    animation-delay: 0.3s;
}

.wave-3 {
    height: 60%;
    animation-delay: 0.6s;
}

@keyframes wave-animation {

    0%,
    100% {
        transform: scaleY(1);
        opacity: 0.7;
    }

    50% {
        transform: scaleY(1.5);
        opacity: 1;
    }
}

/* Текстовая метка */
.speaker-label {
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

.size-small .speaker-label {
    font-size: 10px;
}

.size-large .speaker-label {
    font-size: 14px;
}

/* Скрыть неактивные индикаторы */
.active-speaker-indicator:not(.is-speaking):not(.is-active):not(.is-primary) {
    opacity: 0.3;
    transform: scale(0.9);
}

/* Hover эффект */
.active-speaker-indicator:hover {
    transform: scale(1.05);
}
</style>