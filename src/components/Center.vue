<template>
    <div class="threeNode">
        <div id="container"></div>
        <div id="controls">
            <h1> {{message}} </h1>
<!--            <button id="add" @click="addBox">添加模型</button>-->
            <el-row>
                <el-button round  @click="addBox">添加模型</el-button>
                <el-button type="primary">主要按钮</el-button>
                <el-button type="success">成功按钮</el-button>
            </el-row>
            <el-row>
                <el-button type="info">信息按钮</el-button>
                <el-button type="warning">警告按钮</el-button>
                <el-button type="danger">危险按钮</el-button>
            </el-row>
            <div class="block">
                <el-slider
                        v-model="value"
                        range
                        format-tooltip="setSliderTips"
                        :max="30">
                </el-slider>
            </div>
        </div>
    </div>
</template>
<script>
import Initialize from '../baseThree/Initialize';
export default {
    name: 'Center',
    data () {
        return {
            message: '控制器',
            boxColor: '#FFF000',
            value: [4, 8]
        };
    },
    methods: {
        init () {
            if (!this.INT) {
                const INT = new Initialize('container');
                INT.render();
                this.INT = INT;
            }
        },
        addBox () {
            if (this.INT) {
                this.INT.addBox();
            }
        },
        setSliderTips (value) {
            return value;
        }
    },
    mounted () {
        this.init();
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
    }
    #container{
        position: relative;
        float: left;
        width: 80%;
        height: 100%;
        background: black;
    }
    #controls{
        position: relative;
        float: left;
        width: 20%;
        height: 100%;
        background: #b1d622;
    }
    .el-row {
        margin-bottom: 5px;
    }
    /*button{*/
    /*    position: relative;*/
    /*    margin: 5px;*/
    /*    float: left;*/
    /*    width: 100px ;*/
    /*    height: 20px;*/
    /*    vertical-align: middle;*/
    /*    text-align: center;*/
    /*    background: #390c07;*/
    /*    color: #e3952a;*/
    /*    border: #e39d85;*/
    /*}*/
</style>
