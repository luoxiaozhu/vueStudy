import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from '@/components/HelloWorld';
import Center from '@/components/Center';
import Lines3D from '@/components/Lines3D';
import Area3D from '@/components/Area3D';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/hello',
            name: 'HelloWorld',
            component: HelloWorld
        },
        {
            path: '/center',
            name: 'center',
            component: Center
        },
        {
            path: '/',
            name: 'Area3D',
            component: Area3D
        }
    ]
});
