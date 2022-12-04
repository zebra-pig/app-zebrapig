<template>
  <div ref="content" class="block-content">
    <template v-for="block in blocks" :key="block.id">
      <component :is="'block-'+block.type" :data="block.data"></component>
    </template>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps(["blocks"])
  const content = ref(null)
  const router = useRouter()

    onMounted(() =>{
      content.value.addEventListener("click", handleElementClick)
    })

    onBeforeUnmount(() =>{
      content.value.removeEventListener("click", handleElementClick)
    })




  function handleElementClick(e: MouseEvent){
      var element = e.target as any;
      if(element.tagName == "A"){
        e.preventDefault();
        var target = element.getAttribute('target') || "_self"
        if(!uriOnSameDomain(element.href) || target == '_blank'){
          window.open(element.href, target);
        }
        else{
          var url = new URL(element.href);
          router.push(element.href.substring((url.protocol + url.host).length + 2));
        }
      }
    }
    
  function uriOnSameDomain(uri1: any, uri2?: any){
      if(!uri2)  uri2 = window.location.href;
      uri1 = new URL(uri1);
      uri2 = new URL(uri2);
      if(uri1.host !== uri2.host) return false;
      if(uri1.port !== uri2.port) return false;
      if(uri1.protocol !== uri2.protocol) return false;
      return true;
  }
</script>