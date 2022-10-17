<template>
    <div>
        <theme-style v-if="showreel" :theme="theme" />
        <showreel-content v-if="showreel" :showreel="showreel" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const route = useRoute()

const theme = computed(() => {
    if(showreel){
        return {
            textColor: showreel.value.text_color,
            backgroundColor: showreel.value.background_color,
            accentColor: showreel.value.accent_color,
        }
    }
    return {
        textColor: "#ffffff",
        backgroundColor: "#000000",
        accentColor: "#ffffff"
    }
})

const { data } = useShowreels(route.params.slug)

const title = computed(() => {
    return data?.value?.showreels[0] ? data.value.showreels[0].title : ''
})

const showreel = computed(() => {
    return data?.value?.showreels[0]
})

useHead({
    title
})

</script>