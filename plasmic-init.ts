import { initPlasmicLoader } from "@plasmicapp/loader-vue";
export const PLASMIC = initPlasmicLoader({
    projects: [
        {
            id: "tTxt5p6CcJt2qhjhYS38hK",  // ID of a project you are using
            token: "xCIjIM9pye0hSThHaECnitxv2FTB31W6g68GwFWQxQ0tE4lZ5mf2fcLYXiMiEIXZxP4dW5K3gKVkKNtimGuw"  // API token for that project
        }
    ],
    // Fetches the latest revisions, whether or not they were unpublished!
    // Disable for production to ensure you render only published changes.
    preview: true,
})