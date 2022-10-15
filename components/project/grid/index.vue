<script setup lang='ts'>

const { data, error } = await useAsyncGql('ProjectPageList', { lang: 'de-DE' });

</script>

<template>
    <div class="project-grid" v-if="data?.project_pages">
        <project-grid-card v-for="projectPage in data?.project_pages" :key="projectPage.id"
            :project-page="projectPage" />
    </div>
</template>

<style scoped lang='scss'>
.project-grid
{

    width: 100%;
    max-width: 1200px;
    min-height: 80vh;

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

    gap: 30px;
}
</style>