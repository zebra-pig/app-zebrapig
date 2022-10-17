<template>
  <showreel-hero :showreel="showreel" />
  <showreel-item :showreel-item="item" v-for="item in showreel.showreel_items"/>

</template>

<script setup lang="ts">
type Showreel = {
    hash: string
    id: number
    title: string
    comment: string
    showreel_items: ShowreelItem[]
}

type ShowreelItem = {
  media: Media
}

type Media = {
  external_id: string
}

const {showreel} = defineProps<{
  showreel: Showreel
}>()

</script>