<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script>
export default {
    name: 'App',
    data () {
        return {
            message: 'Welcome to Vue'
        };
    }
};
</script>

<style>
    #app {
        width: 100%;
        height: 100%;
    }
</style>
