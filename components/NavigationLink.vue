<template>
    <btn v-if="elementType == 'btn'" rel="referrer" :to="fullLink" :target="linkTarget" :class="class">{{ linkTitle }}</btn>
    <nuxt-link v-else :to="fullLink" rel="referrer" :target="linkTarget" :class="class">{{ linkTitle }}</nuxt-link>
</template>

<script setup lang="ts">
const localePath = useLocalePath();


const props = defineProps(['link', 'class'])
const { locale } = useI18n()

const linkTitle = computed(() => {
    if(props.link.translations){
        const title = props.link.translations.filter((a: any) => a.language_code.code == locale.value)[0]?.title
        return title
    }
    return props.link.title
})

const linkTarget = computed(() => {
    return "_" + (props.link.target ?? "self")
})

const fullLink = computed(() => {
    if(props.link.route.startsWith("mailto:")){
        return props.link.route
    }
    return localePath('/'+props.link.route)
})

const elementType = computed(() => {
    if(props.link.button){
        return "btn"
    }
    return "nuxt-link"
})
</script>