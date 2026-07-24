<template>
    <section class="wrapper thin">
        <block-content v-if="data && data.pages[0]" :blocks="data.pages[0].translations[0].content.blocks"/>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const route = useRoute()

const data = usePages(route.params.slug.join("/")).data

const title = computed(() => {
    return data.value ? data.value.pages[0].translations[0]?.title : ''
})
useHead({
    title
})

</script>