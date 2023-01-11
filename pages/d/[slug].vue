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
    var textColor = "#ffffff", 
    backgroundColor = "#000000",
    accentColor = "#ffffff"


    textColor = downloadPage.value?.text_color || downloadPage.value?.project?.text_color || "#ffffff"
    backgroundColor = downloadPage.value?.background_color || downloadPage.value?.project?.background_color || "#000000"
    accentColor = downloadPage.value?.accent_color || downloadPage.value?.project?.accent_color || "#ffffff"

    return {
        textColor,
        backgroundColor,
        accentColor
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