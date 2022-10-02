<template>
    <div class="layout">
        <site-header />
        <client-only>
            <background-base />
        </client-only>
        <div class="container">
            <slot/>
        </div>
        <site-footer />
    </div>
</template>

<script setup>

</script>

<style scoped>
.header-spacer{
    height: 60px;
}

@media(max-width: 800px){
    .header-spacer{
        height: 30px;
    }
}
</style>