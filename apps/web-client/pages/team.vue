<script setup lang='ts'>
import anime from 'animejs';

const { team_member: members } = await GqlTeamMembers();

onMounted(() => {
    anime({
        targets: '.team-member-card',
        delay: anime.stagger(50),
        opacity: 1,
        translateY: [ -50, 0 ],
    });
})

</script>

<template>
    <div class="team-grid wrapper" v-if="members">
        <team-member v-for="member of members" :key="member.id" :member="member" />
    </div>
</template>

<style scoped lang='scss'>
.team-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}
</style>