<template>
  <blockquote v-bind:class="cssClasses">
    {{ data.text }}
    <div class="blockquote-caption">{{ data.caption }}</div>
  </blockquote>
</template>

<script>

  export default {
    components: {

    },
    data: () => {
      return {};
    },
    props: ['data'],
    computed:{
      cssClasses(){
        return {
          ["text-"+this.data.alignment]: true
        }
      }
    }
  }
</script>
