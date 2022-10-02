<template>
    <section class="wrapper">
        <block-content v-if="data && data.pages[0]" :blocks="data.pages[0].translations[0].content.blocks"/>
    </section>
</template>

<script setup lang="ts">

const route = useRoute()

const data = usePages("imprint").result;

const title = computed(() => {
    return data.value ? data.value.pages[0].translations[0]?.title : ''
})

useHead({
    title,
})

</script>