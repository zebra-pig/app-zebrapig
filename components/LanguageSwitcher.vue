<template>
    <nuxt-link
        v-for="locale in $i18n.availableLocales"
        :key="locale.code"
        >{{ locale.name }}</nuxt-link>
</template>

<script>
export default {
}
</script>