import { ref, computed } from 'vue'
import {
    Room,
    RoomEvent,
    createLocalVideoTrack,
    createLocalAudioTrack,
    createAudioAnalyser,
    createLocalScreenTracks,
    Track
} from 'livekit-client'

export const useRoomLogic = (roomName) => {
    // ===== ОСНОВНОЕ СОСТОЯНИЕ =====
    const room = ref(null)
    const connected = ref(false)
    const connecting = ref(false)
    const error = ref(null)
    const playbackBlocked = ref(false)
    const userName = ref('user' + Math.floor(Math.random() * 1000))

    // ===== ЛОКАЛЬНЫЕ ТРЕКИ =====
    const localVideoTrack = ref(null)
    const localAudioTrack = ref(null)

    // Локальный шаринг экрана - computed из участника
    const localScreenTrack = computed(() => getLocalScreenTrack())
    const isScreenSharing = computed(() => {
        return room.value?.localParticipant?.isScreenShareEnabled || false
    })

    // ===== УДАЛЁННЫЕ УЧАСТНИКИ =====
    const remoteTracks = ref([])
    const participants = ref([])

    // ===== АКТИВНЫЙ СПИКЕР =====
    const activeSpeakers = ref([])
    const speakingParticipants = ref(new Set())

    // ===== ЛОКАЛЬНЫЙ МОНИТОРИНГ ГРОМКОСТИ =====
    const localVolumeLevel = ref(0)
    const isLocalSpeaking = ref(false)
    let localVolumeMonitor = null
    let audioAnalyser = null

    // ===== ТОКЕН =====
    const fetchToken = async (userEmail, roomName) => {
        // Убеждаемся, что передаем примитивные значения, а не реактивные объекты
        const actualRoomName = roomName?.value || roomName
        console.log('🔑 Запрос токена для:', { userEmail, roomName: actualRoomName })

        try {
            const requestBody = { userId: userEmail, roomName: actualRoomName }
            console.log('📤 Отправляем запрос:', requestBody)

            // Проверяем доступность сервера сначала
            console.log('🌐 Проверяем соединение с сервером...')

            const res = await fetch('https://meet-api.baza.expert/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })

            console.log('📥 Статус ответа:', res.status, res.statusText)
            console.log('📥 Заголовки ответа:', Object.fromEntries(res.headers.entries()))

            if (!res.ok) {
                let errorText
                try {
                    errorText = await res.text()
                } catch {
                    errorText = `HTTP ${res.status} ${res.statusText}`
                }
                console.error('❌ Ошибка HTTP:', res.status, errorText)
                throw new Error(`Сервер вернул ошибку ${res.status}: ${errorText}`)
            }

            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await res.text()
                console.error('❌ Неверный тип контента:', contentType, 'Ответ:', textResponse)
                throw new Error(`Сервер вернул неверный тип контента: ${contentType}`)
            }

            const data = await res.json()
            console.log('📋 Данные ответа:', data)

            const token = data?.token ?? data?.accessToken ?? null
            if (!token) {
                console.error('❌ Токен не найден в ответе:', data)
                throw new Error('Токен отсутствует в ответе сервера')
            }

            console.log('✅ Токен получен успешно, длина:', token.length)
            return token
        } catch (err) {
            console.error('❌ Ошибка получения токена:', err)

            // Дополнительная диагностика для сетевых ошибок
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                console.error('🌐 Проблема с сетью: сервер может быть недоступен на http://localhost:1337')
                throw new Error('Сервер недоступен. Убедитесь, что сервер запущен на http://localhost:1337')
            }

            throw err
        }
    }

    // ===== ATTACH АУДИО =====
    const attachRemoteAudio = (track, participant) => {
        if (!track || track.kind !== 'audio') return

        console.log(`🎧 Прикрепляем аудио трек для ${participant.identity}`)

        let el = document.querySelector(`audio[data-track-sid="${track.sid}"]`)
        if (!el) {
            el = document.createElement('audio')
            el.autoplay = true
            el.playsInline = true
            el.controls = false
            el.dataset.trackSid = track.sid
            document.body.appendChild(el)
        }

        try { track.detach(el) } catch { }

        try {
            track.attach(el)
            console.log(`✅ Аудио прикреплён для ${participant.identity}`)
        } catch (err) {
            console.warn('Ошибка attach:', err)
            if (track.mediaStreamTrack) {
                el.srcObject = new MediaStream([track.mediaStreamTrack])
            }
        }

        el.muted = false
        el.play().catch(() => {
            console.warn('Playback blocked')
            playbackBlocked.value = true
        })
    }

    // ===== МОНИТОРИНГ ГРОМКОСТИ =====
    const startLocalVolumeMonitoring = () => {
        if (!localAudioTrack.value) return

        try {
            audioAnalyser = createAudioAnalyser(localAudioTrack.value)

            const updateVolume = () => {
                if (!audioAnalyser || !localAudioTrack.value) return

                const volume = audioAnalyser.calculateVolume()
                const volumePercent = Math.min(100, volume * 100 * 5)
                localVolumeLevel.value = volumePercent
                isLocalSpeaking.value = volumePercent > 10

                localVolumeMonitor = requestAnimationFrame(updateVolume)
            }

            updateVolume()
        } catch (err) {
            console.warn('Ошибка мониторинга:', err)
        }
    }

    const stopLocalVolumeMonitoring = () => {
        if (localVolumeMonitor) {
            cancelAnimationFrame(localVolumeMonitor)
            localVolumeMonitor = null
        }
        audioAnalyser = null
        localVolumeLevel.value = 0
        isLocalSpeaking.value = false
    }

    // ===== АКТИВНЫЙ СПИКЕР =====
    const handleActiveSpeakersChanged = (speakers) => {
        console.log('🔊 Активные спикеры:', speakers.map(s => s.identity))
        activeSpeakers.value = speakers
    }

    const handleParticipantSpeakingChanged = (participant, isSpeaking) => {
        console.log(`🗣️ ${participant.identity} ${isSpeaking ? 'начал' : 'перестал'} говорить`)
        if (isSpeaking) {
            speakingParticipants.value.add(participant.identity)
        } else {
            speakingParticipants.value.delete(participant.identity)
        }
    }

    const isActiveSpeaker = (participantId) => {
        if (participantId === 'local') {
            return activeSpeakers.value.some(speaker => speaker.identity === room.value?.localParticipant?.identity)
        }
        return activeSpeakers.value.some(speaker => speaker.identity === participantId)
    }

    const isSpeaking = (participantId) => {
        return speakingParticipants.value.has(participantId)
    }

    const getPrimarySpeaker = () => {
        return activeSpeakers.value.length > 0 ? activeSpeakers.value[0] : null
    }

    // ===== ПОЛУЧЕНИЕ ТРЕКОВ =====
    const getParticipantVideoTrack = (participant) => {
        const videoTrack = remoteTracks.value.find(t =>
            t.participant.sid === participant.sid && t.track.kind === 'video'
        )
        return videoTrack?.track || null
    }

    const getParticipantAudioTrack = (participant) => {
        const audioTrack = remoteTracks.value.find(t =>
            t.participant.sid === participant.sid && t.track.kind === 'audio'
        )
        return audioTrack?.track || null
    }

    const getParticipantScreenTrack = (participant) => {
        const screenTrack = remoteTracks.value.find(t =>
            t.participant.sid === participant.sid &&
            t.track.kind === 'video' &&
            t.publication.source === Track.Source.ScreenShare
        )
        return screenTrack?.track || null
    }

    // Получить локальный трек шаринга экрана
    const getLocalScreenTrack = () => {
        if (!room.value?.localParticipant) return null
        const screenPub = room.value.localParticipant.getTrackPublication(Track.Source.ScreenShare)
        return screenPub?.videoTrack || null
    }

    // ===== РАЗРЕШЕНИЯ =====
    const requestMediaPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            console.log('✅ Разрешения получены')
            stream.getTracks().forEach(track => track.stop())
        } catch (err) {
            console.error('❌ Ошибка разрешений:', err)
            error.value = 'Необходимо разрешение на использование камеры и микрофона'
        }
    }

    // ===== СМЕНА УСТРОЙСТВ =====
    const onDeviceChanged = async ({ type, deviceId }) => {
        if (!room.value) return

        try {
            if (type === 'video') {
                // Отключаем текущую камеру
                if (localVideoTrack.value) {
                    await room.value.localParticipant.unpublishTrack(localVideoTrack.value)
                    localVideoTrack.value.stop()
                    localVideoTrack.value = null
                }

                // Включаем новую камеру, если выбрано устройство
                if (deviceId) {
                    const videoTrack = await createLocalVideoTrack({
                        deviceId: { exact: deviceId },
                        facingMode: 'user'
                    })
                    localVideoTrack.value = videoTrack
                    await room.value.localParticipant.publishTrack(videoTrack, {
                        source: Track.Source.Camera,
                        simulcast: true
                    })
                    console.log('✅ Камера переключена')
                }
            } else if (type === 'audio') {
                // Останавливаем мониторинг громкости
                stopLocalVolumeMonitoring()

                // Отключаем текущий микрофон
                if (localAudioTrack.value) {
                    await room.value.localParticipant.unpublishTrack(localAudioTrack.value)
                    localAudioTrack.value.stop()
                    localAudioTrack.value = null
                }

                // Включаем новый микрофон, если выбрано устройство
                if (deviceId) {
                    const audioTrack = await createLocalAudioTrack({
                        deviceId: { exact: deviceId },
                        echoCancellation: true,
                        noiseSuppression: true
                    })
                    localAudioTrack.value = audioTrack
                    await room.value.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone })

                    // Запускаем мониторинг громкости заново
                    startLocalVolumeMonitoring()
                    console.log('✅ Микрофон переключен')
                }
            }
        } catch (err) {
            console.error('❌ Ошибка смены устройства:', err)
            error.value = `Ошибка смены ${type === 'video' ? 'камеры' : 'микрофона'}: ${err.message}`
        }
    }

    // ===== ПОДКЛЮЧЕНИЕ К КОМНАТЕ =====
    const joinRoom = async (userEmail = null) => {
        try {
            connecting.value = true
            error.value = null

            // Используем userEmail для получения токена, если он передан, иначе userName
            const tokenUserId = userEmail || userName.value
            const actualRoomName = roomName?.value || roomName

            const token = await fetchToken(tokenUserId, actualRoomName)


            room.value = new Room()

            // handlers
            room.value.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                console.log(`📥 Трек подписан: ${track.kind} от ${participant.identity}`)

                const trackInfo = { track, participant, publication }
                remoteTracks.value.push(trackInfo)

                if (track.kind === 'audio') {
                    attachRemoteAudio(track, participant)
                }
            })

            room.value.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                console.log(`📤 Трек отписан: ${track.kind} от ${participant.identity}`)
                remoteTracks.value = remoteTracks.value.filter(t => t.track.sid !== track.sid)

                if (track.kind === 'audio') {
                    const audioEl = document.querySelector(`audio[data-track-sid="${track.sid}"]`)
                    if (audioEl) {
                        audioEl.remove()
                    }
                }
            })

            room.value.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log(`👋 Участник подключился: ${participant.identity}`)
                participants.value = Array.from(room.value.remoteParticipants.values())
            })

            room.value.on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log(`👋 Участник отключился: ${participant.identity}`)
                remoteTracks.value = remoteTracks.value.filter(t => t.participant.sid !== participant.sid)
                participants.value = Array.from(room.value.remoteParticipants.values())

                // Удаляем из активных спикеров
                activeSpeakers.value = activeSpeakers.value.filter(s => s.identity !== participant.identity)
                speakingParticipants.value.delete(participant.identity)
            })

            room.value.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
            room.value.on(RoomEvent.ParticipantMetadataChanged, (metadata, participant) => {
                console.log(`📝 Метаданные изменены для ${participant.identity}:`, metadata)
            })

            // Обработка событий говорения
            room.value.on('isSpeakingChanged', handleParticipantSpeakingChanged)

            // connect
            await room.value.connect('wss://realtor.baza.expert/livekit', token)
            connected.value = true
            participants.value = Array.from(room.value.remoteParticipants.values())
            console.log('✅ Подключились к комнате:', actualRoomName)

            // Выбор микрофона по умолчанию
            let chosenDeviceId = undefined
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const audioInputs = devices.filter(d => d.kind === 'audioinput')
                if (audioInputs.length > 0) {
                    const defaultCandidate = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0]
                    chosenDeviceId = defaultCandidate.deviceId
                    console.log('Selected default audio input:', defaultCandidate.label || chosenDeviceId)
                }
            } catch (e) {
                console.warn('enumerateDevices failed:', e)
            }

            // создаём локальные треки
            try {
                const videoTrack = await createLocalVideoTrack({ facingMode: 'user' })
                localVideoTrack.value = videoTrack
                await room.value.localParticipant.publishTrack(videoTrack, {
                    source: Track.Source.Camera,
                    simulcast: true
                })
                console.log('✅ Видео трек создан и опубликован')
            } catch (e) {
                console.warn('❌ Ошибка создания видео трека:', e)
            }

            try {
                const audioOptions = {
                    echoCancellation: true,
                    noiseSuppression: true,
                }
                if (chosenDeviceId) audioOptions.deviceId = chosenDeviceId

                const audioTrack = await createLocalAudioTrack(audioOptions)
                localAudioTrack.value = audioTrack
                await room.value.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone })

                // Запускаем мониторинг громкости
                startLocalVolumeMonitoring()
                console.log('✅ Аудио трек создан и опубликован')
            } catch (e) {
                console.warn('❌ Ошибка создания аудио трека:', e)
            }

            setTimeout(() => tryEnablePlayback(), 300)
        } catch (err) {
            console.error('Join error', err)
            error.value = err?.message || String(err)
        } finally {
            connecting.value = false
        }
    }

    const leaveRoom = async () => {
        try {
            stopLocalVolumeMonitoring()

            if (localVideoTrack.value) {
                localVideoTrack.value.stop()
                localVideoTrack.value = null
            }
            if (localAudioTrack.value) {
                localAudioTrack.value.stop()
                localAudioTrack.value = null
            }
            if (localScreenTrack.value) {
                localScreenTrack.value.stop()
                localScreenTrack.value = null
            }

            // Удаляем все аудио элементы
            document.querySelectorAll('audio[data-track-sid]').forEach(el => el.remove())

            if (room.value) {
                await room.value.disconnect()
            }
        } finally {
            room.value = null
            connected.value = false
            participants.value = []
            remoteTracks.value = []
            activeSpeakers.value = []
            speakingParticipants.value.clear()
            playbackBlocked.value = false
            error.value = null
            isScreenSharing.value = false
            console.log('✅ Покинули комнату')
        }
    }

    const toggleCamera = async () => {
        if (!room.value) return

        try {
            if (localVideoTrack.value) {
                await room.value.localParticipant.unpublishTrack(localVideoTrack.value)
                localVideoTrack.value.stop()
                localVideoTrack.value = null
                console.log('📷 Камера выключена')
            } else {
                const videoTrack = await createLocalVideoTrack({ facingMode: 'user' })
                await room.value.localParticipant.publishTrack(videoTrack, {
                    source: Track.Source.Camera,
                    simulcast: true
                })
                localVideoTrack.value = videoTrack
                console.log('📷 Камера включена')
            }
        } catch (err) {
            console.error('❌ Ошибка переключения камеры:', err)
            error.value = `Ошибка камеры: ${err.message}`
        }
    }

    const toggleMicrophone = async () => {
        if (!room.value) return

        try {
            if (localAudioTrack.value) {
                stopLocalVolumeMonitoring()
                await room.value.localParticipant.unpublishTrack(localAudioTrack.value)
                localAudioTrack.value.stop()
                localAudioTrack.value = null
                console.log('🎤 Микрофон выключен')
            } else {
                // Подбираем устройство по умолчанию
                let chosenDeviceId = undefined
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices()
                    const audioInputs = devices.filter(d => d.kind === 'audioinput')
                    const defaultCandidate = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0]
                    chosenDeviceId = defaultCandidate?.deviceId
                } catch { }

                const opts = { echoCancellation: true, noiseSuppression: true }
                if (chosenDeviceId) opts.deviceId = chosenDeviceId

                const audioTrack = await createLocalAudioTrack(opts)
                await room.value.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone })
                localAudioTrack.value = audioTrack

                // Запускаем мониторинг громкости
                startLocalVolumeMonitoring()
                console.log('🎤 Микрофон включен')
            }
        } catch (err) {
            console.error('❌ Ошибка переключения микрофона:', err)
            error.value = `Ошибка микрофона: ${err.message}`
        }
    }

    // ===== ШАРИНГ ЭКРАНА =====
    const startScreenShare = async () => {
        if (!room.value) return

        try {
            // Используем более простой способ через LocalParticipant API
            await room.value.localParticipant.setScreenShareEnabled(true, {
                audio: true, // Включаем звук с экрана
                resolution: { width: 1920, height: 1080 } // Качество HD
            })

            isScreenSharing.value = true
            console.log('📺 Шаринг экрана начат')

        } catch (err) {
            console.error('❌ Ошибка шаринга экрана:', err)
            error.value = `Ошибка шаринга экрана: ${err.message}`
        }
    }

    const stopScreenShare = async () => {
        if (!room.value) return

        try {
            // Останавливаем шаринг экрана
            await room.value.localParticipant.setScreenShareEnabled(false)

            isScreenSharing.value = false
            console.log('📺 Шаринг экрана остановлен')

        } catch (err) {
            console.error('❌ Ошибка остановки шаринга:', err)
            error.value = `Ошибка остановки шаринга: ${err.message}`
        }
    }

    const toggleScreenShare = async () => {
        if (isScreenSharing.value) {
            await stopScreenShare()
        } else {
            await startScreenShare()
        }
    }

    const tryEnablePlayback = async () => {
        playbackBlocked.value = false
        const els = Array.from(document.querySelectorAll('audio, video'))
        for (const el of els) {
            try {
                if (el.tagName.toLowerCase() === 'video' && el.muted) {
                    await el.play().catch(() => { })
                    continue
                }
                await el.play().catch(() => { playbackBlocked.value = true })
            } catch (e) {
                playbackBlocked.value = true
            }
        }
    }

    // ===== CLEANUP =====
    const cleanup = () => {
        console.log('🧹 Очистка ресурсов при размонтировании')
        leaveRoom()
    }

    return {
        // State
        room,
        connected,
        connecting,
        error,
        playbackBlocked,
        userName,
        localVideoTrack,
        localAudioTrack,
        localScreenTrack,
        isScreenSharing,
        remoteTracks,
        participants,
        activeSpeakers,
        localVolumeLevel,
        isLocalSpeaking,

        // Computed
        isActiveSpeaker,
        isSpeaking,
        getPrimarySpeaker,
        getParticipantVideoTrack,
        getParticipantAudioTrack,
        getParticipantScreenTrack,

        // Methods
        requestMediaPermissions,
        onDeviceChanged,
        joinRoom,
        leaveRoom,
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare,
        startScreenShare,
        stopScreenShare,
        tryEnablePlayback,
        cleanup
    }
}