<template>
    <PlasmicRootProvider :loader="PLASMIC" :prefetchedData="plasmicData">
        <PlasmicComponent :component="$route.fullPath" />
    </PlasmicRootProvider>
</template>

<script setup lang="ts">
import { PlasmicRootProvider, PlasmicComponent } from "@plasmicapp/loader-vue";
import { PLASMIC } from "../plasmic-init";

const route = useRoute();
const plasmicData = await PLASMIC.fetchComponentData(route.fullPath);
</script>