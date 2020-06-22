<template>
  <div class="threeNode">
    <div id="container"></div>
    <div id="controls">
      <div class="block">
        <el-slider
          v-model="value"
          range
          @change="inputFuc"
          :format-tooltip="formatTooltip"
          :marks="marks"
          :min="1"
          :max="106"
        ></el-slider>
      </div>
    </div>
    <div class="zd-tips">
      <div class="zd-name">品类:玩具</div>
      <div class="zd-date">日期:2020/6/1</div>
      <div class="zd-value">利率：50%</div>
    </div>
    <div class="label-tip">信息</div>
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
            value: [1, 1],
            marks: {
                1: '天数:106天'
            }
        };
    },
    methods: {
        init () {
            if (!this.INT) {
                const INT = new Initialize('container', {
                    camera: {
                        position: [ -54.16, 32.783071489510185, 20.41 ]
                    },
                    controls: {
                        target: [ 53.8, 0, 21.23 ],
                        enableZoom: true,
                        enablePan: true,
                        enableRotate: true
                    }
                });
                INT.render();
                INT.setDatas(Data, {});
                INT.setRange(this.value);
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
        },
        formatTooltip (val) {
            const result = val === null ? val : Data[0].content[val - 1].date;
            return result;
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
h1 {
  text-align: center;
}
.threeNode {
  position: relative;
  width: 100%;
  height: 100%;
  background: black;
  overflow: hidden;
}
#container {
  position: relative;
  float: top;
  width: 100%;
  height: 100%;
  background: black;
  overflow: hidden;
}
#controls {
  position: absolute;
  top: 90%;
  left: 25%;
  width: 50%;
  height: 100%;
  background: rgba(177, 214, 34, 0);
}
.zd-tips {
  position: absolute;
  top: 0;
  display: none;
  background: rgba(0, 0, 0, 0.6);
  color: #b4dcf7;
  border-radius: 5px;
  padding: 10px;
}
.label-tip {
  position: absolute;
  top: 0;
  display: none;
  background: rgba(0, 0, 0, 0.6);
  color: #b4dcf7;
  border-radius: 5px;
  padding: 10px;
}
</style>
