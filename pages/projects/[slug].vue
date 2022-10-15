<template>
<div v-if="projectPage" class="project-page">
<theme-style :theme="theme"/>
<project-hero v-if="projectPage.hero" :file="projectPage.hero"/>
</div>
</template>

<style>
</style>

<script setup>
const route = useRoute()
const { data } = useProjectPages(route.params.slug)

const theme = computed(() => {
    return {
        backgroundColor: projectPage.value?.background_color || "#ffffff",
        textColor: projectPage.value?.text_color || "#000000",
        accentColor: projectPage.value?.accent_color || "#000000",
    }
})

const projectPage = computed(() => {
    return data.value?.project_pages[0]
})

const title = computed(() => {
    return projectPage.value?.translations[0].title
})

useHead({
    title
})


definePageMeta({
    pageTransition: {
        name: 'pageTransition',
        mode: 'out-in'
    }
})

</script>

<style lang="scss">
    .project-page{
        &.pageTransition-enter-active,
        &.pageTransition-leave-active{
            transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
            transform-origin: bottom center;
        }

        &.pageTransition-enter-from{
            opacity: 0;
            transform: scale(.8);
        }

        &.pageTransition-enter-to{
            opacity: 1;
            transform: scale(1);
        }

        &.pageTransition-leave-to{
            opacity: 0;
            transform: scale(.8);
            transition: all .5s cubic-bezier(0.45, 0.15, 0.63, 0.17);
        }
    }
</style>