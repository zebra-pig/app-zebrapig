<template>
    <img :srcset="assetSrcSet(file.fileId)" :class="class" :title="title" />
</template>
<script setup>
    const { public: { CONTENT_ENDPOINT, API_BEARER_TOKEN } } = useRuntimeConfig();
    const props = defineProps(['file', 'class', 'title'])


    function assetUrl(id){
        return CONTENT_ENDPOINT + "/" + id;
    }

    function assetSrcSet(id){
        return assetUrl(id)+"?width=1000" + " 1000w, " + assetUrl(id)+"?width=500" + " 500w, " + assetUrl(id)+"?width=200" + " 200w";
    }
</script>