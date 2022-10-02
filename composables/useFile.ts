import { useRuntimeConfig } from "#app";


export default function (file) {
    const { public: { CONTENT_ENDPOINT } } = useRuntimeConfig();

    if(file.id){
        var id = file.id
        var originalFile = file
    }
    else if(file.value.id){
        var id = file.value.id
        var originalFile = file.value
    }
    else{
        var id = file
        var originalFile = {}
    }

    return {
        ...originalFile,
        url: CONTENT_ENDPOINT + "/" + id
    }
}