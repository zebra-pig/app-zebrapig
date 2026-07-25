<template>
    <section class="wrapper tag">
        <template v-if="tag && tag.assigned">
            <p class="eyebrow">{{ t('tag_gear') }}</p>
            <h1>{{ tag.name }}</h1>
            <p v-if="tag.product" class="model">{{ tag.product }}</p>
            <dl class="meta">
                <template v-if="tag.category">
                    <dt>{{ t('tag_category') }}</dt><dd>{{ tag.category }}</dd>
                </template>
                <template v-if="tag.status">
                    <dt>{{ t('tag_status') }}</dt><dd>{{ tag.status }}</dd>
                </template>
            </dl>
        </template>

        <template v-else-if="tag && !tag.valid">
            <h1>{{ t('tag_invalid_title') }}</h1>
            <p class="muted">{{ t('tag_invalid_body') }}</p>
        </template>

        <template v-else>
            <h1>{{ t('tag_unassigned_title') }}</h1>
            <p class="muted">{{ t('tag_unassigned_body') }}</p>
            <p class="token">{{ formatted }}</p>
        </template>
    </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const { public: { API_GQL_ENDPOINT } } = useRuntimeConfig();

interface TagResolution {
    token: string;
    valid: boolean;
    found: boolean;
    assigned: boolean;
    name: string | null;
    product: string | null;
    item: string | null;
    category: string | null;
    status: string | null;
    location: string | null;
}

const rawToken = computed(() => String(route.params.token ?? ''));

const { data: tag } = await useAsyncData<TagResolution | null>(
    () => `tag-${rawToken.value}`,
    async () => {
        if (!API_GQL_ENDPOINT) return null;
        const query = `query ResolveGearTag($token: String!) {
  resolveGearTag(token: $token) {
    token valid found assigned name product item category status location
  }
}`;
        try {
            const res = await $fetch<{ data?: { resolveGearTag: TagResolution } }>(
                API_GQL_ENDPOINT,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: { query, variables: { token: rawToken.value } },
                },
            );
            return res?.data?.resolveGearTag ?? null;
        } catch {
            return null;
        }
    },
    { watch: [rawToken] },
);

// Group the normalized token for display: G7K2-P9XQ-4M8T-3NVB-C
const formatted = computed(() => {
    const s = (tag.value?.token ?? rawToken.value).toUpperCase().replace(/-/g, '');
    return (s.match(/.{1,4}/g) ?? [s]).join('-');
});

const title = computed(() =>
    tag.value?.found ? `${tag.value.name}` : t('tag_unassigned_title'),
);

useHead({
    title,
    // Physical-tag pages are not for search engines.
    meta: [{ name: 'robots', content: 'noindex' }],
});
</script>

<style scoped lang="scss">
.tag {
    max-width: 32rem;
    margin: 4rem auto;
    padding: 0 1.5rem;
}
.eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.75rem;
    opacity: 0.6;
    margin: 0 0 0.25rem;
}
h1 {
    margin: 0;
    font-size: 2rem;
    word-break: break-word;
}
.model {
    font-size: 1.1rem;
    opacity: 0.85;
    margin: 0.25rem 0 1.5rem;
}
.meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.4rem 1rem;
    margin: 0;
}
.meta dt {
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.72rem;
    align-self: center;
}
.meta dd {
    margin: 0;
    font-weight: 600;
}
.muted {
    opacity: 0.7;
    line-height: 1.5;
}
.token {
    margin-top: 1.5rem;
    font-family: ui-monospace, monospace;
    letter-spacing: 0.05em;
    opacity: 0.5;
}
</style>
