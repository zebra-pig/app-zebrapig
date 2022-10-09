<script setup lang='ts'>

const { serviceLinks, activeService } = defineProps<{
    serviceLinks: any[] | undefined,
    activeService: number;
}>()

const emit = defineEmits<{
  (e: 'setActive', index: number): void
}>()

</script>

<template>
    <div class="spacer">
        <div
            class="service-links-desktop"
            v-if="serviceLinks"
        >
            <div class="container">
                <div 
                    class="backdrop" 
                />
                <nuxt-link
                    class="card"
                    v-for="(link, index) of serviceLinks"
                    :key="link.id"
                    :class="{ active: index === activeService }"
                    @mousemove="emit('setActive', index)"
                    :to="link.route"
                >
                    <h1>{{ link.translations[0]?.title }}</h1>
                </nuxt-link>
            </div>
        </div>
    </div>
</template>

<style scoped lang='scss'>

@keyframes slidein 
{
    0%   { transform: translateX(-150%); }
    100% { transform: translateX(0); }
}

.spacer
{
    width: 100%;
    height: 90vh;
    position: relative;
    
    .service-links-desktop
    {
        position: absolute;
    
        left: 3rem;
        bottom: 3rem;
    
        width: max(450px, 25vw);
    
        overflow: hidden;
    
        .container
        {
            $card-height: 7rem;
        
            width: 100%;
            display: flex;
            flex-direction: column;
        
            position: relative;
        
            $link-transition-duration: 0.5s;
        
            mix-blend-mode: difference;
            
            animation: 1s slidein;
        
            .backdrop
            {
                width: 100%;
                height: $card-height;
        
                position: absolute;
                left: 0;
                top: calc(v-bind(activeService) * #{$card-height});
        
                transition: top $link-transition-duration;
        
                background-color: var(--text-color);
                z-index: 0;
            }
        
            .card
            {
                height: $card-height;
        
                padding: 1rem;
                
                display: flex;
                align-items: center;
        
                z-index: 1;
        
                cursor: pointer;
        
                h1
                {
                    margin: 0;
                }
        
                &.active > h1
                {
                    color: var(--background-color);
                }
            }
        }
    }
}

</style>