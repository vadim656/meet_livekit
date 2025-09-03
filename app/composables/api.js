import { v4 as uuidv4 } from "uuid";
import * as qs from 'qs'

const jwt = useCookie('strapi_jwt')


export default class API {
    constructor() {

        this.config = {}

        // this.baseUrl = 'https://meet-api.baza.expert';
        this.baseUrl = 'http://localhost:1337';
        this.token = `Bearer ${jwt.value}`;
    }

    uuid() {
        return uuidv4();
    }


    async fetchData(endpoint, params = '') {
        return await $fetch(`${this.baseUrl}/api${endpoint}?=${params}`, {
            method: 'GET',
            headers: {
                Authorization: this.token
            }
        });
    }

    async postData(endpoint, params = null) {
        return await $fetch(`${this.baseUrl}/api${endpoint}`, {
            method: 'POST',
            body: JSON.stringify({
                data: params
            }),
            headers: {
                Authorization: this.token
            }
        });
    }

    async putData(endpoint, params = null) {
        return await $fetch(`${this.baseUrl}/api${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: params
            }),
            headers: {
                Authorization: this.token
            }
        });
    }

    async deleteData(endpoint) {
        return await $fetch(`${this.baseUrl}/api${endpoint}`, {
            method: 'DELETE',

            headers: {
                Authorization: this.token
            }
        });
    }

    register(args) {

        return this.postData('/client/register', args);
    }
    async getActiveRooms() {
        return this.fetchData('/rooms');
    }

    async getAllRooms() {
        const params = qs.stringify({
            pagination: {
                page: 1,
                pageSize: 25,
            },
            sort: "id:desc",
            populate: {
                clients: true,
                admin_room: true,
                mentors: true
            }
        })
        return this.fetchData('/rooms', params);
    }

    async getRoomActive(id) {
        const params = qs.stringify({


        })
        return this.fetchData(`/rooms/${id}`, params);
    }

    async createRoom(args) {
        // console.log("args", args);
        return this.postData('/rooms', args)
    }
    async deleteRoom(id) {
        return this.deleteData(`/rooms/${id}`)
    }

    async setPauseRoom(...args) {
        return this.putData(`/rooms/${args[0]}`, {
            Active: false

        })
    }

    async setPlayRoom(...args) {
        return this.putData(`/rooms/${args[0]}`, {
            Active: true

        })
    }
    //settings
    async getAllUsers() {
        return this.fetchData('/rooms/users');
    }

    async connectMentor(id, args) {

        return this.putData(`/rooms/${id}`, {
            mentors: {
                connect: args
            }
        });
    }
    async disconnectMentor(id, args) {

        return this.putData(`/rooms/${id}`, {
            mentors: {
                disconnect: args
            }
        });
        // return this.fetchData('/rooms/users');
    }
    async setSettings(...args) {
        console.log("setSettings -> ", args);
        return this.putData(`/rooms/${args[0]}`, {
            Name: args[1].Name,
            Limit: args[1].Limit
        });
        // return this.fetchData('/rooms/users');
    }
    async registerUser(args) {
        console.log("registerUser -> ", args);

        return await $fetch(`${this.baseUrl}/api/auth/local/register`, {
            method: 'POST',
            body: JSON.stringify({
                Name: args.username,
                email: args.email,
                password: args.password,
                username: args.email
            }),

        });


        // return this.fetchData('/rooms/users');
    }

    async sendToken(token, user) {

        return await $fetch(`${this.baseUrl}/api/client/register`, {
            method: 'POST',
            body: JSON.stringify({
                token: token,
                user: user
            }),
        });


        // return this.fetchData('/rooms/users');
    }
    /**
     * Fetches a user by id.
     * @param {string} id - the ID of the user to fetch
     * @returns {Promise<object>} - the fetched user
     */
    async getUser(id) {

        return this.fetchData(`/users/${id}`)


        // return this.fetchData('/rooms/users');
    }






}