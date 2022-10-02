<script setup lang='ts'>

// const { $apolloHelpers } = useNuxtApp()
// const config = useRuntimeConfig()

// onMounted(() =>
// {
//     $apolloHelpers.onLogin(config.public.API_BEARER_TOKEN);
// });

// onUnmounted(() =>
// {
//     $apolloHelpers.onLogout()
// });

// useGqlCors({ credentials: 'same-origin' })
// useGqlToken(config.public.API_BEARER_TOKEN)

</script>

<template>
    <theme-style :theme="{}"/>
    <nuxt-layout>
        <nuxt-page />
    </nuxt-layout> 
</template>

<style scoped>
</style>