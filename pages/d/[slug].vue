<template>
    <div>
        <theme-style :theme="theme" />
        <download-page-hero v-if="downloadPage" :download-page="downloadPage" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const route = useRoute()

const theme = computed(() => {
    if(downloadPage?.value?.project){
        return {
            textColor: downloadPage.value.project.text_color,
            backgroundColor: downloadPage.value.project.background_color,
            accentColor: downloadPage.value.project.accent_color,
        }
    }
    return {
        textColor: "#ffffff",
        backgroundColor: "#000000",
        accentColor: "#ffffff"
    }
})

const { data } = useDownloadPages(route.params.slug)

const title = computed(() => {
    return data?.value?.download_pages[0] ? data.value.download_pages[0].title : ''
})

const downloadPage = computed(() => {
    return data?.value?.download_pages[0]
})

useHead({
    title
})

</script>