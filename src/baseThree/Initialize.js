import {THREE} from '@corelib/three.min';
import $ from 'jquery';
import publicLabel from '@corelib/publicLabel';
import pointImg from '../assets/point.png';
import _Shaders from '../assets/shaders';

const LINE_POINTS_COUNT_UNIT = 100;
const PLANE_FONT_SIZE_RATIO = 30;// -平面文字换算比例
const X_AXIS_INTERVAL = 5;// -x轴间距
const Z_AXIS_INTERVAL = 2;// -z轴间距
const Y_AXIS_MAX_VALUE = 2;
const _createClipPlane = (points, opts) => {
    opts = opts || {};
    const {size = 1, color = '#b2a53d', type} = opts;
    const dataPoints = _getCurvePoints(points, type);
    const geometry = new THREE.PlaneBufferGeometry(size, size, dataPoints.length - 1);
    const { position } = geometry.attributes;
    for (let i = 0, length = dataPoints.length; i < length; i++) {
        const point = dataPoints[i].clone();
        position.array[i * 3] = point.x;
        position.array[i * 3 + 1] = point.y;
        position.array[i * 3 + 2] = point.z;
        position.array[(i + length) * 3] = point.x;
        position.array[(i + length) * 3 + 1] = 0;
        position.array[(i + length) * 3 + 2] = point.z;
    }
    position.needsUpdate = true;
    const colors = _getColorArr(color);
    const material = new THREE.MeshBasicMaterial({
        color: colors[0],
        opacity: 0.5,
        transparent: true,
        side: THREE.DoubleSide,
        wireframe: false
        // depthTest: false
    });

    return new THREE.Mesh(geometry, material);
};

const _getDataFromRange = (datas, value) => {
    const [startIndex, endIndex] = value;
    const result = [];
    datas.forEach(data => {
        const pointData = {};
        pointData.name = data.name;
        pointData.content = data.content.slice(startIndex, endIndex + 1);
        result.push(pointData);
    });
    return result;
};

const _getPointsFromDatas = (datas) => {
    const result = [];
    datas.forEach((data, dataIndex) => {
        const points = [];
        result.push(points);
        data.content.forEach((content, valueIndex) => {
            const vector = new THREE.Vector3(dataIndex * X_AXIS_INTERVAL + 3,
                (content.value) * Y_AXIS_MAX_VALUE,
                (valueIndex) * Z_AXIS_INTERVAL + 3);
            points.push(vector);
        });
    });
    return result;
};

// const _createSpriteText = (node) => {
//
// };

const _getCurvePointsFromDatas = (datas) => {
    const points = [];
    datas.forEach((data, dataIndex) => {
        const curvePoints = [];
        data.content.forEach((content, valueIndex) => {
            curvePoints.push(new THREE.Vector3(X_AXIS_INTERVAL * dataIndex + 3,
                (content.value) * Y_AXIS_MAX_VALUE, Z_AXIS_INTERVAL * valueIndex + 3));
        });
        points.push(_getCurvePoints(curvePoints, 'z'));
    });
    const result = [];
    for (let i = 0, length = points[0].length; i < length; i++) {
        const curverPoints = [];
        for (let j = 0, dataLength = points.length; j < dataLength; j++) {
            curverPoints.push(points[j][i]);
        }
        result.push(_getCurvePoints(curverPoints, 'x'));
    }
    return result;
};
const _createTopFace = (datas, opts) => {
    opts = opts || {};
    const points = _getCurvePointsFromDatas(datas);

    const geometry = new THREE.PlaneBufferGeometry(1, 1, points.length - 1, points[0].length - 1);
    const { position } = geometry.attributes;
    // geometry.addAttribute('color',
    //     new THREE.BufferAttribute(new Float32Array(position.array.length), 3));
    // const vertexColors = geometry.attributes.color;
    for (let i = 0, length = points.length; i < length; i++) {
        for (let j = 0, hLength = points[i].length; j < hLength; j++) {
            position.array[3 * (i * hLength + j)] = points[i][j].x;
            position.array[3 * (i * hLength + j) + 1] = points[i][j].y;
            position.array[3 * (i * hLength + j) + 2] = points[i][j].z;
            // const heightColor = _getColorFromHeight(points[i][j].y);
            // vertexColors.array[3 * (i * hLength + j)] = heightColor.r;
            // vertexColors.array[3 * (i * hLength + j) + 1] = heightColor.g;
            // vertexColors.array[3 * (i * hLength + j) + 2] = heightColor.b;
        }
    }
    position.needsUpdate = true;
    // vertexColors.needsUpdate = true;
    geometry.computeVertexNormals();
    const glColors = [
        new THREE.Color('#fff35b'),
        new THREE.Color('#a78b48'),
        new THREE.Color('#af1a1a'),
        new THREE.Color('#322854'),
        new THREE.Color('#250e2a')
    ];
    const material = new THREE.ShaderMaterial({
        defines: {
            NUM_DISTINCT: glColors.length
        },
        uniforms: {
            u_x: {
                value: 0.0
            },
            u_time: {
                value: 0.0
            },
            u_z: {
                value: 0.0
            },
            colorArr: {
                value: glColors
            },
            colorNum: {
                value: glColors.length
            },
            height: {
                value: Y_AXIS_MAX_VALUE * 5
            },
            u_lightDirection: {
                value: new THREE.Vector3(1.0, 0.0, 0.0).normalize()
            }, // 光照角度
            u_lightColor: {
                value: new THREE.Color('#cfcfcf')
            }, // 光照颜色
            u_AmbientLight: {
                value: new THREE.Color('#dddddd')
            } // 全局光颜色
        },
        side: THREE.DoubleSide,
        vertexShader: _Shaders.TopFaceVShader,
        fragmentShader: _Shaders.TopFaceFShader
    });
    return new THREE.Mesh(geometry, material);
};
const _createPoint = (points, opts) => {
    opts = opts || {};
    const {pointSize = 0.5, index, color = '#7d7e86', type, localPlane} = opts;
    const pointCloud = new THREE.Object3D();
    pointCloud._index = index;
    const texture = new THREE.TextureLoader().load(pointImg);
    const cGeo = new THREE.Geometry();
    const Build = new THREE.Mesh(cGeo.clone());
    const colors = _getColorArr(color);

    points.forEach((point, index) => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            color: colors[0],
            clippingPlanes: [localPlane]
        }));
        sprite.position.copy(point);
        sprite.position.y += 0.2;
        sprite.scale.set(pointSize, pointSize, pointSize);
        sprite._index = index;
        sprite._type = type;
        sprite._color = colors[0];
        pointCloud.add(sprite);
        Build.geometry = new THREE.PlaneGeometry(pointSize * 2, pointSize * 2);
        Build.position.copy(point);
        Build.updateMatrix();
        cGeo.merge(Build.geometry, Build.matrix);
    });
    const obj = new THREE.Mesh(cGeo, new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
    }));
    obj._isHelper = true;
    obj._index = index;
    mEvent.push(obj);
    pointCloud.add(obj);
    return pointCloud;
};
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

const _isArray = (o) => {
    return Object.prototype.toString.call(o) === '[object Array]';
};

const _getColorArr = (str) => {
    if (_isArray(str)) return str; // error
    var _arr = [];
    str = str + '';
    str = str.toLowerCase().replace(/\s/g, '');
    // eslint-disable-next-line no-useless-escape
    if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
        var arr = str.replace(/rgba\(|\)/gi, '').split(',');
        var hex = [
            pad2(Math.round(arr[0] * 1 || 0).toString(16)),
            pad2(Math.round(arr[1] * 1 || 0).toString(16)),
            pad2(Math.round(arr[2] * 1 || 0).toString(16))
        ];
        _arr[0] = new THREE.Color('#' + hex.join(''));
        _arr[1] = Math.max(0, Math.min(1, (arr[3] * 1 || 0)));
    } else if (str === 'transparent') {
        _arr[0] = new THREE.Color();
        _arr[1] = 0;
    } else {
        _arr[0] = new THREE.Color(str);
        _arr[1] = 1;
    }

    function pad2 (c) {
        return c.length === 1 ? '0' + c : '' + c;
    }

    return _arr;
};

const _create3DMesh = () => {
    let geometry = new THREE.BoxGeometry(5, 5, 5);
    let material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    return new THREE.Mesh(geometry, material);
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

const _createTextCanvas = (content) => {
    let canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    const context = canvas.getContext('2d');
    context.font = '100 30px Arial';
    const wh = context.measureText(content);
    const width = THREE.Math.ceilPowerOfTwo(wh.width);
    const height = 32;
    canvas.width = width;
    canvas.height = height;
    canvas.style.backgroundColor = 'rgba(255,255,255,1)';
    context.font = '100 30px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // 设置字体填充颜色
    context.fillStyle = 'white';
    context.lineWidth = 10;
    context.fillText(content, width / 2, height / 2);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture._size = {width, height, realWidth: wh.width};
    canvas = null;
    return texture;
};

const _createPlaneText = (opts) => {
    opts = opts || {};
    const {type = '', content = '', index} = opts;
    const texture = _createTextCanvas(content);
    const {_size} = texture;
    const {width, height, realWidth} = _size;
    const geometry = new THREE.PlaneGeometry(width / PLANE_FONT_SIZE_RATIO, height / PLANE_FONT_SIZE_RATIO);
    let matrix = new THREE.Matrix4();
    if (type === 'x') {
        // matrix = matrix.multiply(new THREE.Matrix4().makeTranslation(
        //     -width / (2 * PLANE_FONT_SIZE_RATIO), 0, 0));
        matrix = matrix.multiply(new THREE.Matrix4().makeRotationX(
            -Math.PI / 2
        ));
        matrix = matrix.multiply(new THREE.Matrix4().makeRotationZ(
            -Math.PI / 2
        ));
        // matrix = matrix.multiply(new THREE.Matrix4()
        //     .makeTranslation(width / (2 * PLANE_FONT_SIZE_RATIO), 0, 0));
    } else if (type === 'z') {
        matrix = matrix.multiply(new THREE.Matrix4().makeRotationX(
            -Math.PI / 2
        ));
        matrix = matrix.multiply(new THREE.Matrix4().makeRotationZ(
            -Math.PI
        ));
    }
    geometry.applyMatrix(matrix);
    const material = new THREE.MeshLambertMaterial({
        map: texture, transparent: true, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh._size = {width: realWidth / PLANE_FONT_SIZE_RATIO};
    mesh._index = index;
    mesh._isLabel = true;
    mesh._type = type;
    mEvent.push(mesh);
    return mesh;
};

const _createAxios = (opts) => {
    opts = opts || {};
    const { length = 100, divsion = 100 } = opts;
    const group = new THREE.Object3D();
    var axesHelper = new THREE.AxesHelper(length);
    group.add(axesHelper);

    var helper = new THREE.GridHelper(length, divsion);
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    helper.position.set(length / 2, 0, length / 2);
    group.add(helper);
    return group;
};

const _getCurvePoints = (points, type) => {
    const newPoints = points.concat();
    if (type) {
        const startPoint = newPoints[0].clone();
        startPoint.setY(0);
        const endPoint = newPoints[newPoints.length - 1].clone();
        endPoint.setY(0);
        type === 'x' ? startPoint.setX(0) : startPoint.setZ(0);
        newPoints.unshift(startPoint);
        newPoints.push(endPoint);
    }

    const curve = new THREE.CatmullRomCurve3(newPoints);
    return curve.getPoints(LINE_POINTS_COUNT_UNIT);
};

const _createPolyLine = (points, opts) => {
    const group = new THREE.Object3D();
    opts = opts || {};
    const {color = '#fffbfa', type, index, localPlane, withPoint} = opts;
    const colors = _getColorArr(color);
    const dataPoints = _getCurvePoints(points, type);
    dataPoints.forEach(point => {
        point.y += 0.1;
    });
    // -创建线
    const geometry = new THREE.BufferGeometry().setFromPoints(dataPoints);
    const material = new THREE.LineBasicMaterial({ transparent: true,
        color: colors[0],
        opacity: colors[1],
        clippingPlanes: [ localPlane ]});
    const lineMesh = new THREE.Line(geometry, material);
    lineMesh._type = type;
    lineMesh._index = index;
    group.add(lineMesh);
    // -创建点
    if (withPoint)group.add(_createPoint(points, {index, type, localPlane}));

    return group;
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
const randomColor = () => { // 十六进制颜色随机
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const color = ('#' + r.toString(16) + g.toString(16) + b.toString(16) + '000').slice(0, 7);
    return color;
};
const raycaster = new THREE.Raycaster();
raycaster.params.Sprite.threshold = 5;
let dfConfig = {};
let mEvent = [];

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

    addBox () {
        let cube = _create3DMesh();
        cube.position.set(Math.random() * 80 - 40, Math.random() * 80 - 40, 0);
        cube.rotation.set(Math.random(), Math.random(), 0);
        this.cubes.push(cube);
        this.scene.add(cube);
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
            self.scene.add(_createAxios());
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
        }
    }
    setRange (value) {
        const self = this;
        self._value = value;
        if (self._model === '3D') {
            self.disposeObject();
            const datas = _getDataFromRange(self._metaData, value);
            self._datas = datas;
            if (self.topFace) {
                publicLabel.disposeObj(self.topFace);
            }
            self.topFace = _createTopFace(datas);
            self.topFace.userData = {
                xValue: 0.0,
                zValue: 0.0

            };
            self.scene.add(self.topFace);
            if (!self._localPlane) {
                self._localPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.0);
            } else {
                self._localPlane.set(new THREE.Vector3(0, 0, -1), 0.0);
                self._localPlane._start = false;
                self._localPlane._end = false;
            }
            const [startIndex] = value;
            const points = _getPointsFromDatas(datas);
            self._points = points;
            // -创建z轴标签
            points[0].forEach((point, i) => {
                const zLabel = _createPlaneText({type: 'z', content: datas[0].content[i].date, index: i});
                zLabel.position.set(-zLabel._size.width / 2 - 1, 0, point.z);
                self.zLabels.add(zLabel);
                // -创建z方向线
                const linePoints = [];
                points.forEach(p => {
                    linePoints.push(p[i]);
                });
                self.lines.add(_createPolyLine(linePoints, {
                    type: 'x', index: i, localPlane: self._localPlane, withPoint: true
                }));
            });
            // -创建x轴标签
            points.forEach((point, index) => {
                const xLabel = _createPlaneText({
                    type: 'x', content: datas[index].name, index
                });
                xLabel.position.set(point[0].x, 0, -xLabel._size.width / 2 - 1);
                self.xLabels.add(xLabel);
                // -创建x方向线
                // self.lines.add(_createPolyLine(point, {
                //     type: 'z', index, localPlane: self._localPlane, withPoint: true
                // }));
            });
        }
    }

    disposeObject () {
        const self = this;
        if (self.zLabels || self.lines || self.xLabels) {
            publicLabel.disposeObj(self.zLabels);
            publicLabel.disposeObj(self.lines);
            publicLabel.disposeObj(self.xLabels);
            mEvent = [];
            self.scene.add(self.zLabels);
            self.scene.add(self.xLabels);
            self.scene.add(self.lines);
        }
    }

    pickSprite (node) {
        const self = this;
        const {position} = node;
        if (self.topFace) {
            self.topFace.material.uniforms.u_x.value = 0.0;
            self.topFace.material.uniforms.u_z.value = 0.0;
            self.topFace.userData.xValue = position.x + 0.001;
            self.topFace.userData.zValue = position.z + 0.001;
        }
        if (self._clipPlane) {
            publicLabel.disposeObj(self._clipPlane);
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
            self._clipPlane = _createClipPlane(linePoints, {
                type: 'x'
            });
            self.scene.add(self._clipPlane);
            if (self._localPlane) {
                self._localPlane.set(new THREE.Vector3(0, 0, 1), -position.z + 0.1);
                if (self._localPlane._start)self._localPlane._end = true;
            }
        } else if (node._type === 'x') {
            self._clipPlane = _createClipPlane(points[node._index], {
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

        if (intersects.length > 0) {
            self.container[0].style.cursor = 'pointer';
            if (intersects[0].object._isHelper) {
                const {faceIndex, object} = intersects[0];
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
                self.pickSprite(intersects[0].object);
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
                    publicLabel.disposeObj(self._clipPlane);
                }
            }
        }, 300);
    }
}

export default Initialize;
