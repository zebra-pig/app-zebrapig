<template>
  <div ref="container" v-html="html"></div>
</template>

<script>
  export default {
    props: ['html'],
    methods: {
      processHtml(){
        var sources = [];
        var scriptTags = this.$refs.container.getElementsByTagName("script");
        for (var i = 0; i < scriptTags.length; i++) {
          var scriptTag = scriptTags[i];
          if(scriptTag.getAttribute('src') != null){
            sources.push(scriptTag.getAttribute('src'))
          }
        }

        for (var i = 0; i < sources.length; i++) {
          var script = document.createElement('script');
          script.src = sources[i];
          script.setAttribute("async", true);
          script.setAttribute("type", "text/javascript");
          this.$refs.container.appendChild(script);
        }
      }
    },
    mounted(){
      setTimeout(() => {
        this.processHtml()
      }, 1000);
    }
  }
</script>
