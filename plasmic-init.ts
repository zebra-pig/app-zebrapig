import pkg from '@plasmicapp/loader-vue';
const { initPlasmicLoader } = pkg

export const PLASMIC = initPlasmicLoader({
    projects: [
        {
            id: "tTxt5p6CcJt2qhjhYS38hK",  // ID of a project you are using
            token: "xCIjIM9pye0hSThHaECnitxv2FTB31W6g68GwFWQxQ0tE4lZ5mf2fcLYXiMiEIXZxP4dW5K3gKVkKNtimGuw"  // API token for that project
        }
    ],
})