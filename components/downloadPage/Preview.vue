<template>
    <div>
        <iframe :src="previewUrl" allowfullscreen="true"></iframe>
    </div>
</template>

<script setup>
    const { downloadPage } = defineProps(["download-page"])

    const previewUrl = computed(() => {
        return downloadPage.download_url.replaceAll("/edit", "/preview")
    })
</script>

<style lang="scss" scoped>
    iframe{
        border: 0px;
        width: 90vw;
        aspect-ratio: calc(1920/1080);
    }
</style>