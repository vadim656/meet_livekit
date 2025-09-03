import { defineStore } from 'pinia'
import { v4 as uuidv4 } from "uuid";

export const useStore = defineStore('main', {
    state: () => ({
        count: 4,
        stateAdd: ''
    }),
    getters: {
        doubleCount: (state) => state.count * 2,
        getPlus: (state) => state.stateAdd,
    },
    actions: {
        actionPlus() {
            this.stateAdd = uuidv4()
        },
    },
    persist: true,
})
