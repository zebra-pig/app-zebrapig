<template>
    <PlasmicRootProvider :loader="PLASMIC" :prefetchedData="plasmicData">
        <PlasmicComponent :component="route.fullPath" />
    </PlasmicRootProvider>
</template>

<script setup lang="ts">
import { PLASMIC } from "../plasmic-init";
import { PlasmicRootProvider, PlasmicComponent }  from "@plasmicapp/loader-vue";

const route = useRoute();
const plasmicData = await PLASMIC.fetchComponentData(route.fullPath);
</script>