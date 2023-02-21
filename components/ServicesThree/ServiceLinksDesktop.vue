<script setup lang='ts'>

const { serviceLinks, activeService } = defineProps<{
    serviceLinks: any[] | undefined,
    activeService: number;
}>()

const emit = defineEmits<{
  (e: 'setActive', index: number): void
}>()

const { locale } = useI18n()

</script>

<template>
    <div class="spacer center-layout-height">
        <div
            class="service-links-desktop"
            v-if="serviceLinks"
        >
            <div class="container">
                <div class="backdrop">
                    <span class="material-symbols-outlined icon">chevron_right</span>
                </div>
                <nuxt-link
                    class="card"
                    v-for="(link, index) of serviceLinks"
                    :key="link.id"
                    :class="{ active: index === activeService }"
                    @mousemove="emit('setActive', index)"
                    :to="localePath(link.route)"
                >
                    <h1>{{ link.translations.filter((a: any) => a.language_code.code == locale)[0]?.title }}</h1>
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
    position: relative;
    
    .service-links-desktop
    {
        position: absolute;
        color: var(--text-color);
    
        left: 3rem;
        bottom: calc(130px + 3rem);
    
        width: max(400px, 25vw);
    
        // overflow: hidden;
    
        .container
        {
            $card-height: 7rem;
        
            width: 100%;
            display: flex;
            flex-direction: column;
        
            position: relative;
        
            $link-transition-duration: 0.5s;
                    
            animation: .75s slidein cubic-bezier(0, 0.22, 0, 0.96);
        
            .backdrop
            {
                width: 100%;
                height: $card-height;
        
                position: absolute;
                left: 0;
                top: calc(v-bind(activeService) * #{$card-height});
        
                transition: top $link-transition-duration;
        
                border: 4px solid var(--text-color);
                z-index: 0;
                display: flex;
                align-items: center;
                justify-content: flex-end;

                .icon{
                    font-size: 100px;
                    font-variation-settings: 'wght' 300;
                }
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
                    color: var(--text-color);
                }
            }
        }
    }
}

</style>