export default defineNuxtRouteMiddleware((to, _from) => {
    const counter = useCookie('patch')
    // counter.value = to.fullPath
    useCookie('patch', {path: '/'}).value = to.fullPath
    const user = useStrapiUser()
    console.log("useStrapiUser -> ", user ,counter)
    if (!user.value) {
        
        // useCookie('redirect', {path: '/'}).value = to.fullPath
        return navigateTo('/auth')
    }
})