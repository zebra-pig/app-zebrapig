<script setup lang='ts'>

useHead({
    title: 'Team',
})

const { member } = defineProps<{
    member: Awaited<ReturnType<typeof GqlTeamMembers>>['team_member'][0];
}>();

const translation = useTranslation(member.translations);
const settings = await GqlPageSettings();
const email = [ member.email, settings.settings?.email_domain ].join('@');

</script>

<template>
    <div class="team-member-card">
        <img class="portrait" :src="useFile(member.portrait)" />
        <h3 class="name">{{ member.name }}</h3>
        <p class="desc">{{ translation?.description }}</p>
        <a class="email" :href="`mailto:${email}`">{{ email }}</a>
    </div>
</template>

<style scoped lang='scss'>
.team-member-card {

    /* border: 1px solid white; */
    padding: 1rem;

    opacity: 0;

    .portrait {
        width: 300px;
        height: 300px;
        object-fit: cover;

        border-radius: 20px;
    }

    .name {}

    .desc {}

    .email {
        font-weight: bold;
    }
}
</style>