<template>
    <span class="theme-style" v-html="styleHtml"></span>
</template>

<script setup>
const props = defineProps(['theme'])


const styleHtml = computed(() => {
    var theme = props.theme
    return `<style>
            :root,:before,:after{
                --background-color: ${theme.backgroundColor ? theme.backgroundColor : "var(--default-background-color)"};
                --background-color-transparent: ${theme.backgroundColor ? theme.backgroundColor + "00" : "var(--default-background-color-transparent)"};
                --background-color-semi-transparent: ${theme.backgroundColor ? theme.backgroundColor + "90" : "var(--default-background-color-semi-transparent)"};
                --text-color: ${theme.textColor ? theme.textColor : "var(--default-text-color)"};
                --text-color-semi-transparent: ${theme.textColor ? theme.textColor + "90" : "var(--default-text-color-semi-transparent)"};
                --text-color-transparent: ${theme.textColor ? theme.textColor + "00" : "var(--default-text-color-transparent)"};
                --accent-color: ${theme.accentColor ? theme.accentColor : "var(--default-accent-color)"};
                --plyr-color-main: ${theme.accentColor ? (theme.accentColor == "#ffffff" ? "#555555" : theme.accentColor) : "#000000"};
            }
        </style>`.replaceAll("\n", "").replaceAll("   ", "")
    }
)
</script>

<style scoped>
.theme-style{
    display: none;
}
</style>