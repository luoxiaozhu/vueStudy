<template>
    <div class="threeNode">
        <div id="container"></div>
        <div id="controls">
            <div class="block">
                <el-slider
                        v-model="value"
                        range
                        @input="inputFuc"
                        :marks="marks"
                        :max="30">
                </el-slider>
            </div>
        </div>
    </div>
</template>
<script>
import Initialize from '../baseThree/Initialize';
import Data from '../assets/data';
export default {
    name: 'Area3D',
    data () {
        return {
            message: '控制器',
            boxColor: '#FFF000',
            value: [4, 9],
            marks: {
                0: '6.1',
                15: '6.15',
                30: '6.30'
            }
        };
    },
    methods: {
        init () {
            if (!this.INT) {
                const INT = new Initialize('container', {
                    camera: {
                        position: [-24.0, 32.5, -22.3]
                    },
                    controls: {
                        target: [17.5, 0, 19.2],
                        enableZoom: true,
                        enablePan: true,
                        enableRotate: true
                    }
                });
                INT.render();
                INT.setDatas(Data, {

                });
                this.INT = INT;
            }
        },
        addBox () {
            if (this.INT) {
                this.INT.addBox();
            }
        },
        inputFuc (value) {
            if (this.INT) this.INT.setRange(value);
        },
        changeCamera () {
            if (this.INT) this.INT.switchCamera();
        }
    },
    mounted () {
        const self = this;
        self.init();
        // setTimeout(function () {
        //     self.value = [10, 15];
        // }, 3000);
    }
};
</script>
<style scoped>
    h1{
        text-align: center;
    }
    .threeNode{
        position: relative;
        width: 100%;
        height: 100%;
        background: black;
        overflow: hidden;
    }
    #container{
        position: relative;
        float: top;
        width: 100%;
        height: 100%;
        background: black;
        overflow: hidden;
    }
    #controls{
        position: absolute;
        top: 90%;
        left: 40%;
        width: 20%;
        height: 100%;
        background: rgba(177, 214, 34, 0);
    }
</style>
