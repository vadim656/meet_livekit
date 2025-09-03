<script setup>
defineProps({
    data: Object
})

const emits = defineEmits(['pause', 'play', 'delete', 'edit'])

const toast = useNotifi()
const configAPI = useRuntimeConfig();
function copyToClipboard(text) {
    navigator.clipboard.writeText(configAPI.public.FRONT + '/room/' + text)
        .then(() => {
            toast.showSuccess("Ссылка скопирована!");

        })
        .catch(error => toast.showSuccess("Ссылка не скопирована!"));
}

</script>

<template>
    <div
        class="p-2.5 flex flex-col justify-between items-center border border-neutral-600 h-40 rounded-xl relative text-sm">
        <span class="w-full text-left font-semibold">{{ data?.Name }}</span>
        <span class="w-full text-xs text-left text-neutral-500">{{ data.documentId }}</span>
        <span v-if="data.Active" class="absolute top-2.5 right-2.5 text-green-500 font-bold">Запущена</span>
        <div class="flex justify-center w-full">
            <!-- <div class="flex flex-col items-center">
        <span>Создал</span>
        <span class="font-semibold text-lg">{{ data.admin_room?.Name }}</span>
      </div> -->
            <!-- <div class="flex flex-col items-center">
        <span>Менторы </span>
        <span class="font-semibold text-lg">0 / {{ data.mentors?.length }}</span>
      </div> -->
        </div>
        <div class="flex justify-between gap-2.5 w-full items-center">
            <div class="flex items-center justify-start gap-2.5">
                <!-- <button @click="emits('edit', data.documentId)" class="button_icon_blue">
          <Icon name="proicons:settings" size="18px" class="text-white" />
        </button> -->
                <Transition name="fade" mode="out-in">
                    <button v-if="data.Active" v-tooltip.rigth="'Скопировать ссылку на конференцию'"
                        @click="copyToClipboard(data.documentId)" class="button_icon_blue">
                        <Icon name="proicons:link" size="18px" class="text-white" />
                    </button>
                </Transition>
            </div>

            <Transition name="fade" mode="out-in">
                <div v-if="!data.Active" class="flex items-center justify-end w-full gap-2.5">
                    <button @click="emits('play', data.documentId)" class="button_icon_blue">
                        <Icon name="proicons:play" size="18px" class="text-white" />
                    </button>
                    <button @click="emits('delete', data.documentId)" class="button_icon_red">
                        <Icon name="proicons:delete" size="18px" class="text-white" />
                    </button>
                </div>
                <div v-else class="flex items-center justify-end w-full gap-2.5">
                    <button v-tooltip.rigth="'Остановить конференцию'" @click="emits('pause', data.documentId)"
                        class="button_icon_red">
                        <Icon name="proicons:cancel" size="18px" class="text-white" />
                    </button>
                    <button v-tooltip.rigth="'Перейти в конференцию'" @click="navigateTo(`/admin/room/${data.documentId}`,

                    )" class="button_icon_blue">
                        <!-- {
            open: {
              target: '_blank'
            }
          } -->
                        <Icon name="proicons:arrow-foward" size="18px" class="text-white" />
                    </button>
                </div>
            </Transition>
        </div>

    </div>
</template>

<style scoped></style>