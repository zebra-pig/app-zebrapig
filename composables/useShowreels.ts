export default function (hash: string) {
    return useAsyncGql('ShowreelsByHash', { hash });
}