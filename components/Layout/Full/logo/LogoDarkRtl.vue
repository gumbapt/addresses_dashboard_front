<script setup lang="ts">
const logoSrc = '/images/logos/xyzies-logo.png';
</script>
<template>
    <div class="logo">
        <NuxtLink to="/">
            <img :src="logoSrc" alt="Xyzies Logo" style="max-width: 180px; height: auto;" />
        </NuxtLink>
    </div>
</template>
