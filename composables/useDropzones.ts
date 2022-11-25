
export default function (hash: string) {
    return useAsyncGql('DropzonesByHash', { hash });
}