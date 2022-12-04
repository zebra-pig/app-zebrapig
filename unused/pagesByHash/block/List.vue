<template>
  <component :is="listType">
    <li v-for="item in data.items" v-html="item"></li>
  </component>
</template>

<script>

  export default {
    components: {

    },
    data: () => {
      return {};
    },
    props: ['data'],
    computed: {
      listType(){
        if(this.data.style == 'ordered'){
          return "ol";
        }
        else{
          return "ul";
        }
      }
    }
  }
</script>
