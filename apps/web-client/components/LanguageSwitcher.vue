<template>
    <nuxt-link class="locale-link" v-for="locale in selectLocales" :to="switchLocalePath(locale)">{{ locale }}</nuxt-link>
</template>

<style lang="scss" scoped>
.locale-link {
    margin-right: 20px;
    text-transform: uppercase;
}
</style>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
const i18n = useI18n()
// @nuxtjs/i18n v9 removed the global `switchLocalePath` auto-import in favour
// of the composable.
const switchLocalePath = useSwitchLocalePath()

const selectLocales = computed(() => {
    return i18n.availableLocales.filter((code) => code != i18n.locale.value)
})
</script>