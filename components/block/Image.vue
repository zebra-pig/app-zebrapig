<template>
    <figure :class="{'full-width': data.stretched}">
    <file :file="data.file" :title="data.caption"></file>
    <figcaption>{{ data.caption }}</figcaption>
    </figure>
</template>

<script setup>
    const props = defineProps(['data'])
</script>

<style scoped lang="scss">
    figure{
        width: 100%;
        margin: 0px;
        max-width: 600px;
        margin: auto;

        &.full-width{
            max-width: unset;
        }

        img{
            width: 100%;
        }
    }
</style>