import MyComponent from '../../../../slices/TextBlock';
import SliceZone from 'vue-slicezone'

export default {
  title: 'slices/TextBlock'
}


export const _Default = () => ({
  components: {
    MyComponent,
    SliceZone
  },
  methods: {
    resolve() {
      return MyComponent
    }
  },
  data() {
    return {
      mock: {"variation":"default","version":"sktwi1xtmkfgx8626","items":[{}],"primary":{"title":[{"type":"heading1","text":"Motor","spans":[]}],"description":[{"type":"paragraph","text":"Proident amet magna exercitation quis enim sunt dolor Lorem id culpa adipisicing magna. Aute excepteur velit occaecat dolor laboris ex nostrud voluptate tempor veniam.","spans":[]}]},"id":"_Default","slice_type":"text_block"}
    }
  },
  template: '<SliceZone :slices="[mock]" :resolver="resolve" />'
})
_Default.storyName = ''
