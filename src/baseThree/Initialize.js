import {THREE} from '@corelib/three.min';
import $ from 'jquery';
import PublicFunc from '@corelib/PublicFunc';

const Y_DELTA_COUNT = 10;

const _creatContainer = (id) => {
    var containers = $('<div></div>');
    containers.css('cssText', 'top:0;left:0;height:100%;width:100%;overflow:hidden;position:absolute;');
    containers.attr('id', id);
    return containers;
};
const _parseCts = (cts) => {
    let $dom = (typeof cts === 'object') ? $(cts) : $('#' + cts);
    if ($dom.length <= 0) return null;
    return $dom;
};
const _detector = () => {
    try {
        return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
    } catch (e) {
        return false;
    }
};
const _getWH = (container) => {
    return {
        w: container.width(),
        h: container.height()
    };
};
const defaultConfig = {
    background: {
        color: '#ffffff',
        opacity: 0.0
    },
    camera: {
        fov: 45,
        near: 1,
        far: 20000,
        position: [0, 100, 100],
        zoom: 3
    },
    controls: {
        mouseDownPrevent: false,
        enablePan: true,
        panSpeed: 5.0,
        enableZoom: true,
        zoomSpeed: 0.5,
        enableRotate: true,
        rotateSpeed: 0.5,
        distance: [0, 8000],
        polarAngle: [0, Math.PI / 2],
        azimuthAngle: [-Infinity, Infinity],
        target: [0, 0, 0]
    }
};
const _animation = (self, dt) => {
    if (dt < 0.1) {
        if (self.controls)self.controls.update();
        if (self.topFace) {
            const time = self.topFace.material.uniforms.u_time;
            time.value += dt;
            if (time.value >= 1) {
                time.value = 1;
                if (self._localPlane)self._localPlane._start = true;
                self._mouseEventStart = true;
            }
            if (self._localPlane && self._localPlane._start && !self._localPlane._end)self._localPlane.constant += 0.2;
            const {userData} = self.topFace;
            const x = self.topFace.material.uniforms.u_x;
            if (userData.xValue > x.value)x.value += 0.5;

            const z = self.topFace.material.uniforms.u_z;
            if (userData.zValue > z.value)z.value += 0.5;
        }
    }
};

const _setControls = (controls, opts) => {
    controls.zoomSpeed = opts.zoomSpeed;
    controls.enablePan = opts.enablePan;
    controls.enableKeys = opts.enablePan;
    controls.keyPanSpeed = opts.panSpeed;
    controls.enableZoom = opts.enableZoom;
    controls.rotateSpeed = opts.rotateSpeed;
    controls.enableRotate = opts.enableRotate;

    controls.minDistance = opts.distance[0];
    controls.maxDistance = opts.distance[1];
    controls.minPolarAngle = opts.polarAngle[0];
    controls.maxPolarAngle = opts.polarAngle[1];
    controls.minAzimuthAngle = opts.azimuthAngle[0];
    controls.maxAzimuthAngle = opts.azimuthAngle[1];
    controls.mouseDownPrevent = opts.mouseDownPrevent;
};

const _pick = (event, self) => {
    event.preventDefault();
    let wh = _getWH(self.container);
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / wh.w) * 2 - 1;
    mouse.y = -(event.clientY / wh.h) * 2 + 1;
    raycaster.setFromCamera(mouse, self.camera);
    return raycaster.intersectObjects(mEvent, true);
};

const raycaster = new THREE.Raycaster();
raycaster.params.Sprite.threshold = 5;
let dfConfig = {};
let mEvent = [];
let clickObject = null;
class Initialize {
    constructor (cts, config) {
        let conts = _parseCts(cts);
        if (_detector() && conts != null) {
            try {
                config = config || {};
                dfConfig = $.extend(true, {}, defaultConfig, config);
                this.container = _creatContainer(THREE.Math.generateUUID());
                this.parentCont = conts;
                this.parentCont.append(this.container);
                this.scene = new THREE.Scene();
                // - 添加灯光
                var directionalLight = new THREE.DirectionalLight(0xffffff, 5);
                directionalLight.position.set(10, 20, 0);
                this.scene.add(directionalLight);

                this.clock = new THREE.Clock();
                let wh = _getWH(this.container);
                let cm = dfConfig.camera, bg = dfConfig.background;
                let ct = dfConfig.controls;

                this.persCamera = new THREE.PerspectiveCamera(45, wh.w / wh.h, cm.near, cm.far);
                this.persCamera.position.set(cm.position[0], cm.position[1], cm.position[2]);

                this.orthCamera = new THREE.OrthographicCamera(-0.5 * wh.w, 0.5 * wh.w, wh.h / 2, -wh.h / 2, cm.near, cm.far);
                this.orthCamera.position.set(-20, 0, 0);
                this.orthCamera.zoom = cm.zoom;
                this.orthCamera.updateProjectionMatrix();
                this.camera = this.persCamera;

                // controls
                this.controls = new THREE.OrbitControls(this.camera, this.container[0]);
                this.controls.target.set(ct.target[0], ct.target[1], ct.target[2]);
                _setControls(this.controls, ct);

                // renderer
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });
                this.renderer.autoClear = false;
                this.renderer.setSize(wh.w, wh.h);
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.setClearColor(bg.color, bg.opacity);
                this.renderer.localClippingEnabled = true;
                this.container.append(this.renderer.domElement);
                // -添加鼠标事件
                window.addEventListener('resize', this.onWindowResize.bind(this), false);
                this.container[0].addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
                this.container[0].addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
                this.container[0].addEventListener('dblclick', this.onDocumentDoubleClick.bind(this), false);
                this.cubes = [];
                this._model = '3D';
                this._mouseEventStart = false;
                this.df_dbClickDelay = false;
            } catch (e) {
                console.log(e);
            }
        }
    }

    render () {
        let self = this;
        let Animations = function () {
            self.renderer.render(self.scene, self.camera);
            requestAnimationFrame(Animations);
            _animation(self, self.clock.getDelta());
        };
        Animations();
    }

    switchCamera () {
        const self = this;
        const {camera, controls} = dfConfig;
        self.camera.position.set(camera.position[0], camera.position[1], camera.position[2]);
        self.controls.target.set(controls.target[0], controls.target[1], controls.target[2]);
        self.controls.update();
        self._model = '3D';
        self.setRange(self._value);
    }

    setDatas (datas) {
        const self = this;
        if (self.scene) {
            self.scene.add(PublicFunc.createAxios());
            datas.forEach(data => {
                data.content.reverse();
            });
            self._metaData = datas;
            if (!self.zLabels) {
                self.zLabels = new THREE.Object3D();
                self.scene.add(self.zLabels);
            }
            if (!self.lines) {
                self.lines = new THREE.Object3D();
                self.scene.add(self.lines);
            }
            if (!self.xLabels) {
                self.xLabels = new THREE.Object3D();
                self.scene.add(self.xLabels);
            }
            if (!self.yLabels) {
                self.yLabels = new THREE.Object3D();
                self.scene.add(self.yLabels);
            }
        }
    }
    setRange (value) {
        const self = this;
        self._value = value.map(item => item - 1);
        if (self._model === '3D') {
            self.disposeObject();
            const datas = PublicFunc.getDataFromRange(self._metaData, self._value);
            const valueRange = PublicFunc.getDatasValueRange(datas);
            const delta = (valueRange.maxValue - valueRange.minValue) / Y_DELTA_COUNT;
            let startValue = valueRange.minValue;
            while (startValue < valueRange.maxValue) {
                const sprite = PublicFunc.createSpriteText({content: startValue.toFixed(2)});
                sprite.position.y = (startValue - valueRange.minValue) * 10;
                self.yLabels.add(sprite);
                startValue += delta;
            }
            if (!self._localPlane) {
                self._localPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.0);
            } else {
                self._localPlane.set(new THREE.Vector3(0, 0, -1), 0.0);
                self._localPlane._start = false;
                self._localPlane._end = false;
            }
            self._datas = datas;
            if (self.topFace) {
                PublicFunc.disposeObj(self.topFace);
            }
            self.topFace = PublicFunc.createTopFace(datas, { localPlane: self._localPlane });
            self.topFace.userData = {
                xValue: 0.0,
                zValue: 0.0

            };
            self.scene.add(self.topFace);
            const points = PublicFunc.getPointsFromDatas(datas);
            self._points = points;
            // -创建z轴标签
            points[0].forEach((point, i) => {
                const zLabel = PublicFunc.createPlaneText({type: 'z', content: datas[0].content[i].date, index: i}, mEvent);
                zLabel.position.set(-zLabel._size.width / 2 - 1, 0, point.z);
                self.zLabels.add(zLabel);
                // -创建z方向线
                const linePoints = [];
                points.forEach(p => {
                    linePoints.push(p[i]);
                });
                self.lines.add(PublicFunc.createPolyLine(linePoints, {
                    type: 'z', index: i, localPlane: self._localPlane, withPoint: true
                }, mEvent));
            });
            // -创建x轴标签
            points.forEach((point, index) => {
                const xLabel = PublicFunc.createPlaneText({
                    type: 'x', content: datas[index].name, index
                }, mEvent);
                xLabel.position.set(point[0].x, 0, -xLabel._size.width / 2 - 1);
                self.xLabels.add(xLabel);
                // -创建x方向线
                self.lines.add(PublicFunc.createPolyLine(point, {
                    type: 'x', index, localPlane: self._localPlane
                }, mEvent));
            });
        }
    }

    disposeObject () {
        const self = this;
        if (self.zLabels || self.lines || self.xLabels || self.yLabels) {
            PublicFunc.disposeObj(self.zLabels);
            PublicFunc.disposeObj(self.lines);
            PublicFunc.disposeObj(self.xLabels);
            PublicFunc.disposeObj(self.yLabels);
            mEvent = [];
            self.scene.add(self.zLabels);
            self.scene.add(self.xLabels);
            self.scene.add(self.lines);
            self.scene.add(self.yLabels);
        }
        if (self._clipPlane) {
            PublicFunc.disposeObj(self._clipPlane);
        }
        if (self._fatLine) {
            PublicFunc.disposeObj(self._fatLine);
        }
    }

    pickSprite (node) {
        const self = this;
        const {position} = node;
        if (self.topFace) {
            self.topFace.material.uniforms.u_x.value = 0.0;
            self.topFace.material.uniforms.u_z.value = 0.0;
            self.topFace.userData.xValue = position.x;
            self.topFace.userData.zValue = position.z;
        }
        if (self._clipPlane) {
            PublicFunc.disposeObj(self._clipPlane);
        }
        if (self._localPlane) {
            self._localPlane.set(new THREE.Vector3(0, 0, 1), 0);
            self._localPlane._end = true;
        }
        const points = self._points;
        if (node._type === 'z') {
            const linePoints = [];
            for (let i = 0; i < points.length; i++) {
                linePoints.push(points[i][node._index]);
            }
            self._clipPlane = PublicFunc.createClipPlane(linePoints, {
                type: 'x'
            });
            self.scene.add(self._clipPlane);
            if (self._localPlane) {
                self._localPlane.set(new THREE.Vector3(0, 0, 1), -position.z + 0.1);
                if (self._localPlane._start)self._localPlane._end = true;
            }
        } else if (node._type === 'x') {
            self._clipPlane = PublicFunc.createClipPlane(points[node._index], {
                type: 'z'
            });
            self.scene.add(self._clipPlane);
            if (self._localPlane) {
                self._localPlane.set(new THREE.Vector3(1, 0, 0), -position.x + 0.1);
                if (self._localPlane._start)self._localPlane._end = true;
            }
        }
    }
    onWindowResize (event) {
        const self = this;
        var wh = _getWH(self.container);
        self.camera.aspect = wh.w / wh.h;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(wh.w, wh.h);
        // self.controls.reset();
    }

    onDocumentMouseMove (event) {
        event.preventDefault();
        const self = this;
        if (!self._mouseEventStart) return;
        const intersects = _pick(event, self);
        $('.zd-tips').hide();
        self.container[0].style.cursor = 'auto';
        if (self._axesLine) {
            PublicFunc.disposeObj(self._axesLine);
        }
        // PublicFunc.changeLineColor(undefined, undefined, self.lines);
        if (clickObject) {
            clickObject.material.color = clickObject.userData.color;
            clickObject = null;
        }
        if (intersects.length > 0) {
            self.container[0].style.cursor = 'pointer';
            if (intersects[0].object._isHelper) {
                const {faceIndex, object, point} = intersects[0];
                const { _datas } = self;
                const index = Math.floor(faceIndex / 2);
                const content = _datas[index].content[object._index];
                const name = '品类：' + _datas[index].name;
                const date = '日期：' + content.date;
                const value = '利率：' + content.value.toFixed(2);
                // if (obj.name != oldName) {
                $('.zd-tips').show();
                const h = $('.zd-tips').height();

                $('.zd-tips>.zd-name').text(name);
                $('.zd-tips>.zd-date').text(date);
                $('.zd-tips>.zd-value').text(value);
                $('.zd-tips').css({
                    top: event.clientY - h - 30,
                    left: event.clientX + 30
                });
                self._axesLine = PublicFunc.createAxesLine(point);
                self.scene.add(self._axesLine);
                // PublicFunc.changeLineColor(object._type, object._index, self.lines);
            } else if (intersects[0].object._isLabel) {
                if (clickObject !== intersects[0].object) {
                    clickObject = intersects[0].object;
                    clickObject.material.color = new THREE.Color('#FF0000');
                }
            }
        }
    }

    onDocumentMouseDown (event) {
        event.preventDefault();
        const self = this;
        clearTimeout(self.df_dbClickDelay);
        const intersects = _pick(event, self);
        if (intersects.length > 0) {
            if (intersects[0].object._isLabel) {
                const {object} = intersects[0];
                self.pickSprite(object);
                PublicFunc.changeLineColor(object._type, object._index, self.lines);
                if (self._fatLine) {
                    PublicFunc.disposeObj(self._fatLine);
                }
                const curve = PublicFunc.getCurveFromLine(object._type, object._index, self.lines);
                if (curve) {
                    self._fatLine = PublicFunc.createFatLine(curve);
                    self.scene.add(self._fatLine);
                }
            } else if (intersects[0].object._isHelper) {
                const {object} = intersects[0];
                PublicFunc.changeLineColor(object._type, object._index, self.lines);
            }
            self.container[0].style.cursor = 'pointer';
        } else {
            self.container[0].style.cursor = 'auto';
        }
    }

    onDocumentDoubleClick (event) {
        event.preventDefault();
        const self = this;
        self.df_dbClickDelay = setTimeout(function () {
            const intersects = _pick(event, self);
            if (intersects.length < 1 || !intersects[0].object._isLabel) {
                if (self.topFace) {
                    self.topFace.material.uniforms.u_x.value = 0.0;
                    self.topFace.material.uniforms.u_z.value = 0.0;
                    self.topFace.userData.xValue = 0.0;
                    self.topFace.userData.zValue = 0.0;
                }
                if (self._localPlane) {
                    self._localPlane.set(new THREE.Vector3(0, 0, 1), 0);
                    self._localPlane._end = true;
                }
                if (self._clipPlane) {
                    PublicFunc.disposeObj(self._clipPlane);
                }
                PublicFunc.changeLineColor(undefined, undefined, self.lines);
                if (self._fatLine) {
                    PublicFunc.disposeObj(self._fatLine);
                }
            }
        }, 300);
    }
}

export default Initialize;
