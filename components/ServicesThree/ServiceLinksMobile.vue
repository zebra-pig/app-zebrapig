<script setup lang='ts'>

const props = defineProps<{
    serviceLinks: any[] | undefined,
    activeService: number;
}>()

const { serviceLinks, activeService } = toRefs(props);

const emit = defineEmits<{
    (e: 'setActive', index: number): void
}>()

const links = ref(null);

function goNext()
{
    const next = (activeService.value + 1) % serviceLinks.value.length;
    emit('setActive', next);
}

function goLast()
{
    const last = (activeService.value - 1 + serviceLinks.value.length) % serviceLinks.value.length;
    emit('setActive', last);
}

onMounted(() =>
{
    let touchX = 0;

    links.value.addEventListener('touchstart', e =>
    {
        touchX = e.changedTouches[0].screenX;
    }, false);

    links.value.addEventListener('touchend', e =>
    {
        const delta = e.changedTouches[0].screenX - touchX;

        if (delta < -5) goNext();
        if (delta > 5) goLast();
    }, false);
});

</script>

<template>
    <div class="spacer center-layout-height">
        <div 
            v-if="serviceLinks"
            class="links"
            ref="links"
        >
            <h1
                class="title"
                v-for="(link, index) in serviceLinks"
                :style="{
                    '--pos': index - activeService,
                }"
            >
                {{ link.translations[0].title }}
            </h1>
            <h1 
                class="arrow-left"
                @click="goLast()"
            ><span class="material-symbols-outlined">chevron_left</span></h1>
            <h1 
                class="arrow-right"
                @click="goNext()"
            ><span class="material-symbols-outlined">chevron_right</span></h1>
        </div>
    </div> 
</template>

<style scoped lang='scss'>

.spacer
{
    width: 100%;
    position: relative;

    animation: fadeIn 1s;
    animation-delay: .5s;
    animation-fill-mode: backwards;
    @keyframes fadeIn {
        from{opacity: 0}
    }

    .links
    {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: var(--header-footer-height);
    
        overflow: hidden;
    
        color: var(--text-color);
        background-color: var(--background-color);
    
        border-bottom: var(--border-style);
    
        .arrow-left,
        .arrow-right
        {
            position: absolute;
            height: 100%;
            top: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 20px;
            margin: 0;
    
            width: 3rem;
    
        }
    
        .arrow-left { left: 0; }
        .arrow-right { right: 0; }
    
        .title
        {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
    
            margin: 0;
    
            display: flex;
            justify-content: center;
            align-items: center;
    
            font-size: 1.6rem;
    
            --pos: 1;
    
            transform: translateX(calc(500px * var(--pos)));
    
            transition: transform 0.5s;
        }
    }
}

</style>