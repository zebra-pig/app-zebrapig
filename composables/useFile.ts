import { useRuntimeConfig } from "#app";

type File = { id: string };

export function useAsset(id: string) {
    const { public: { CONTENT_ENDPOINT } } = useRuntimeConfig();
    return CONTENT_ENDPOINT + "/" + id;
}

export default function useFile<F extends File>(file: F | null | undefined) {
    if (!file) return;
    return useAsset(file.id);
}
