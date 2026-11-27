import axios from "axios";

const http = axios.create({
    baseURL: "/api",

    withCredentials: true,

    timeout: 60000
});

export default http;