<template>
    <btn v-if="elementType == 'btn'" rel="referrer" :to="fullLink" :target="linkTarget" :class="class">{{ linkTitle }}</btn>
    <nuxt-link v-else :to="fullLink" rel="referrer" :target="linkTarget" :class="class">{{ linkTitle }}</nuxt-link>
</template>

<script setup>
const props = defineProps(['link', 'class'])

const linkTitle = computed(() => {
    if(props.link.translations){
        return props.link.translations[0].title
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
    return '/'+props.link.route
})

const elementType = computed(() => {
    if(props.link.button){
        return "btn"
    }
    return "nuxt-link"
})
</script>