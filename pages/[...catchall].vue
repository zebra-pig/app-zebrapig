<template>
    <PlasmicRootProvider :loader="PLASMIC" :prefetchedData="plasmicData">
        <PlasmicComponent :component="$route.fullPath" />
    </PlasmicRootProvider>
</template>

<script setup lang="ts">
import pkg from "@plasmicapp/loader-vue";
import { PLASMIC } from "../plasmic-init";

const {  PlasmicRootProvider, PlasmicComponent } = pkg

const route = useRoute();
const plasmicData = await PLASMIC.fetchComponentData(route.fullPath);
</script>