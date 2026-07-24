<template>
<div class="block-questionanswer">
  <div :class="{'questionanswer': true, 'expanded': visible}" ref="container">
    <div class="question">
      <div class="name">Lensed</div>
      <div class="content" v-html="data.question"></div>
    </div>
    <div class="answer">
      <div class="name">{{ data.partner }}</div>
      <div class="content" v-html="data.answer"></div>
    </div>
  </div>
</div>
</template>

<script>

  export default {
    components: {

    },
    mounted(){
      this.checkScrolling()
      window.addEventListener("scroll", (e) => {this.checkScrolling(e)})
    },
    beforeDestroy(){
      window.removeEventListener("scroll", (e) => {this.checkScrolling(e)})
    },
    data: () => {
      return {
        visible: false
      };
    },
    props: ['data'],
    methods: {
      checkScrolling(e){
        if(this.visible){
          return
        }

        var elementTop = this.$refs.container.getBoundingClientRect().top
        if(elementTop < window.innerHeight){
          this.visible = true
        }
      }
    }
  }
</script>
