<template>
    <div class="showreel-item">
<div class="showreel-item-content">
    <div class="wrapper showreel-comment">
        <h2>{{ showreelItem.media.title }}</h2>
        <p>{{ showreelItem.comment }}</p>
    </div>
    <media-player :media="showreelItem.media"/>
</div>
</div>
</template>

<script lang="ts" setup>
const { showreelItem } = defineProps(["showreelItem"])

</script>

<style lang="scss" scoped>
.showreel-comment{
    margin-bottom: 0px;
    padding-bottom: 15px;

    h2{
        margin-top: 0px;
    }

    p{
        margin-bottom: 0px;
    }
}

.showreel-item{
    display: flex;
    align-items: center;
    flex-direction: column;
    border-bottom: solid 2px var(--text-color);
    border-top: solid 2px var(--text-color);
}

.showreel-item-content{
    max-width: 1000px;
    width: 100%;
}
</style>