<template>
    <div class="wrapper">
        <div class="container mx-auto flex flex-col gap-12">
            <div class="w-full flex justify-between items-center">
                <div>MeetTime</div>
                <div class="flex gap-4 ">
                    <Button @click="visibleAdd = true" class="!text-white">Создать конференцию</Button>
                    <Button class="!text-white">Выйти</Button>
                </div>
            </div>
            <div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <admin-room v-for="(room, i) in dataRooms?.data" :key="room.documentId" :data="room"
                        @pause="pauseRoom" @play="playRoom" @delete="deleteRoom" @edit="editRoom" />
                </div>
                <!-- <pre>{{ dataRooms }}</pre> -->

            </div>
        </div>

    </div>

    <Dialog v-model:visible="visibleAdd" modal header="Создать конференцию" :style="{ width: '300px' }">
        <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2.5 items-start justify-start">
                <label for="username" class="text-sm ">Название</label>
                <InputText type="text" v-model="nameRoom" />

            </div>
            <!-- <div class="flex flex-col gap-2.5 items-start justify-start">
                <label for="username" class="text-sm ">Лимит учестников (1 000 макс)</label>

                <InputNumber v-model="limitRoom" :min="0" :max="1000" inputId="integeronly" fluid class="!w-32" />
            </div>
            <div class="flex flex-col items-start justify-start mb-8 gap-2.5">
                <label for="username" class="text-sm w-full text-start">Задать код</label>
                <InputOtp v-model="pin" :length="4" />

            </div> -->

            <div class="flex justify-end gap-2.5">
                <button class=button_disable @click="visibleAdd = false">Отменить</button>
                <button class="button_default" @click="createRoom">Создать</button>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import API from "~/composables/api";

const api = new API()
import useNotifi from "~/composables/useNotifi";
const toast = useNotifi()

definePageMeta({
    middleware: 'auth'
})

const {
    data: dataRooms,
    status: statusRooms,
    execute: refreshStatusRooms
} = await useAsyncData(`rooms:${api.uuid()}`, async () => {
    const rooms = api.getAllRooms()
    return rooms
})

const visibleAdd = ref(false)
const nameRoom = ref('')

function createRoom() {
    api.createRoom({
        // admin_room: user.value.documentId,
        Name: nameRoom.value,
        // Limit: limitRoom.value,
        // Pin: pin.value
    })
        .then(r => {
            toast.showSuccess("Конференция создана!");
            visibleAdd.value = false
            refreshStatusRooms()
        })
        .catch(() => {
            toast.showError("Что то пошло не так!");
        })
}

function playRoom(id) {
    api.setPlayRoom(id)
        .then(r => {
            toast.showSuccess("Конференция запущенна!");
            refreshStatusRooms()
        })
        .catch(() => {
            toast.showError("Что то пошло не так!");
        })

}

function deleteRoom(id) {
    api.deleteRoom(id)
        .then(r => {
            toast.showSuccess("Конференция удалена!");
            visibleAdd.value = false
            refreshStatusRooms()
        })
        .catch(() => {
            toast.showError("Что то пошло не так!");
        })
}

function pauseRoom(id) {
    api.setPauseRoom(id)
        .then(r => {
            toast.showSuccess("Конференция остановлена!");
            refreshStatusRooms()
        })
        .catch(() => {
            toast.showError("Что то пошло не так!");
        })

}


</script>

<style scoped>
@reference "tailwindcss";
@reference "@/assets/css/global.css";

.wrapper {
    @apply bg-gray-900 h-screen w-screen flex flex-col gap-12 text-white py-12;
}
</style>