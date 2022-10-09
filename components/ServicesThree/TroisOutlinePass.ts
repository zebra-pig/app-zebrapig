import { defineComponent, watch } from 'vue'
import { EffectPass } from 'troisjs';
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutlinePass } from './ModifiedThreeOutlinePass';

const props = {
    selectedObjects: { type: Array, default: [] }
} as const

export default defineComponent({
    extends: EffectPass,
    props,
    created()
    {
        if (!this.renderer) return

        // https://github.com/troisjs/trois/blob/master/src/effects/BokehPass.ts
        if (!this.renderer.scene)
        {
            console.error('Missing Scene')
            return
        }
        if (!this.renderer.camera)
        {
            console.error('Missing Camera')
            return
        }

        // const pass = new HalftonePass(this.renderer.size.width, this.renderer.size.height, {})

        const size = new THREE.Vector2(this.renderer.size.width, this.renderer.size.height);
        const pass = new OutlinePass(size, this.renderer.scene, this.renderer.camera);
        pass.edgeStrength = 2;
        pass.edgeGlow = 0;
        pass.edgeThickness = 0.1;
        pass.visibleEdgeColor = new THREE.Color(0x000000);
        pass.hiddenEdgeColor = new THREE.Color(0x000000);

        this.renderer.addListener('resize', ({ size }) => 
        {
            pass.resolution.set(size.width, size.height);
        })

        watch(
            () => this.selectedObjects, 
            (newSelection) => 
            {
                pass.selectedObjects = newSelection;
            }
        );

        // Object.keys(props).forEach(p =>
        // {
        //     // @ts-ignore
        //     pass.uniforms[ p ].value = this[ p ]
        //     // @ts-ignore
        //     watch(() => this[ p ], (value) => { pass.uniforms[ p ].value = value })
        // })

        this.initEffectPass(pass)
    },
    __hmrId: 'TroisOutlinePass',
})