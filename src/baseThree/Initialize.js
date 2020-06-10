import {THREE} from '@corelib/three.min';
import $ from 'jquery';
import publicLabel from '@corelib/publicLabel';
import pointImg from '../assets/point.png';
import ImprovedNoise from '../lib/ImprovedNoise';

const LINE_POINTS_COUNT = 100;
const PLANE_FONT_SIZE_RATIO = 30;// -平面文字换算比例
const X_AXIS_INTERVAL = 5;// -x轴间距
const Z_AXIS_INTERVAL = 5;// -z轴间距
const Y_AXIS_MAX_VALUE = 20;
const _createClipPlane = (points, opts) => {
    opts = opts || {};
    const {size = 1, color = randomColor()} = opts;
    const geometry = new THREE.PlaneGeometry(size, size, points.length - 1);
    const {vertices} = geometry;
    for (let i = 0, length = points.length; i < length; i++) {
        vertices[i] = points[i].clone();
        vertices[i + length] = points[i].clone().setY(0);
    };
    const colors = _getColorArr(color);
    const material = new THREE.MeshBasicMaterial({
        color: colors[0],
        opacity: 0.5,
        transparent: true,
        side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
};

const _getDataFromRange = (datas, value) => {
    const [startIndex, endIndex] = value;
    const result = [];
    datas.forEach(data => {
        const pointData = {};
        pointData.name = data.name;
        pointData.value = data.value.slice(startIndex, endIndex);
        result.push(pointData);
    });
    return result;
};

const _getPointsFromDatas = (datas) => {
    const points = [];
    datas.forEach((data, dataIndex) => {
        const curvePoints = [];
        data.value.forEach((value, valueIndex) => {
            curvePoints.push(new THREE.Vector3(X_AXIS_INTERVAL * dataIndex, value * Y_AXIS_MAX_VALUE, Z_AXIS_INTERVAL * valueIndex));
        });
        points.push(_getCuverPoints(curvePoints));
    });
    const result = [];
    for (let i = 0, length = points[0].length; i < length; i++) {
        const curverPoints = [];
        for (let j = 0, dataLength = points.length; j < dataLength; j++) {
            curverPoints.push(points[j][i]);
        }
        result.push(_getCuverPoints(curverPoints));
    }
    return result;
};
const _generateHeight = (width, height) => {
    var size = width * height, data = new Uint8Array(size),
        perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

    for (var j = 0; j < 4; j++) {
        for (var i = 0; i < size; i++) {
            var x = i % width, y = ~~(i / width);
            data[ i ] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
        }

        quality *= 5;
    }

    return data;
};

const _generateTexture = (data, width, height) => {
    let canvas, canvasScaled, context, image, imageData, vector3, sun, shade;

    vector3 = new THREE.Vector3(0, 0, 0);

    sun = new THREE.Vector3(1, 1, 1);
    sun.normalize();

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    let i = 0;
    let j = 0;
    let l = imageData.length;
    for (; i < l; i += 4, j++) {
        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = 2;
        vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.normalize();

        shade = vector3.dot(sun);

        imageData[ i ] = (96 + shade * 128) * (0.5 + data[ j ] * 0.007);
        imageData[ i + 1 ] = (32 + shade * 96) * (0.5 + data[ j ] * 0.007);
        imageData[ i + 2 ] = (shade * 96) * (0.5 + data[ j ] * 0.007);
    }

    context.putImageData(image, 0, 0);

    // Scaled 4x

    canvasScaled = document.createElement('canvas');
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext('2d');
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    i = 0;
    l = imageData.length;
    for (; i < l; i += 4) {
        const v = ~~(Math.random() * 5);

        imageData[ i ] += v;
        imageData[ i + 1 ] += v;
        imageData[ i + 2 ] += v;
    }

    context.putImageData(image, 0, 0);

    return canvasScaled;
};

const _createTopFace = (datas, opts) => {
    opts = opts || {};
    const {color = randomColor()} = opts;
    const colors = _getColorArr(color);
    const points = _getPointsFromDatas(datas);
    const geometry = new THREE.PlaneGeometry(1, 1, points.length - 1, points[0].length - 1);
    const { vertices } = geometry;
    for (let i = 0, length = points.length; i < length; i++) {
        for (let j = 0, hLength = points[i].length; j < hLength; j++) {
            vertices[i * hLength + j] = points[i][j];
        }
    }
    const data = _generateHeight(128, 128);
    const texture = new THREE.CanvasTexture(_generateTexture(data, 128, 128));
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    const material = new THREE.MeshBasicMaterial({
        color: colors[0], transparent: true, side: THREE.DoubleSide, map: texture
    });
    return new THREE.Mesh(geometry, material);
};
const _createPoint = (points, opts) => {
    opts = opts || {};
    const {pointSize = 1, index, color = randomColor()} = opts;
    const pointCloud = new THREE.Object3D();
    pointCloud._index = index;
    const texture = new THREE.TextureLoader().load(pointImg);
    const cGeo = new THREE.Geometry();
    const Build = new THREE.Mesh(cGeo.clone());
    const colors = _getColorArr(color);
    points.forEach((point, index) => {
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: colors[0], depthTest: false }));
        sprite.position.copy(point);
        sprite.scale.set(pointSize, pointSize, pointSize);
        sprite._index = index;
        pointCloud.add(sprite);
        Build.geometry = new THREE.PlaneGeometry(pointSize * 2, pointSize * 2);
        Build.position.copy(point);
        // Build.rotation.x = Math.PI / 2;
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
        polarAngle: [-Math.PI, Math.PI],
        azimuthAngle: [-Math.PI, Math.PI],
        target: [0, 0, 0]
    }
};
const _animation = (self, dt) => {
    if (dt < 0.1) {
        if (self.controls)self.controls.update();
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
    context.font = 'normal 30px Arial';
    const wh = context.measureText(content);
    const width = THREE.Math.ceilPowerOfTwo(wh.width);
    const height = 32;
    canvas.width = width;
    canvas.height = height;
    canvas.style.backgroundColor = 'rgba(255,255,255,1)';
    context.font = 'normal 30px Arial';
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
    const {type = '', content = ''} = opts;
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
        map: texture, transparent: true, side: THREE.DoubleSide, depthTest: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh._size = {width: realWidth / PLANE_FONT_SIZE_RATIO};
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

const _getCuverPoints = (points) => {
    const curve = new THREE.CatmullRomCurve3(points);
    return curve.getPoints(LINE_POINTS_COUNT);
};

const _createPolyLine = (points, opts) => {
    const group = new THREE.Object3D();
    opts = opts || {};
    const {color = randomColor(), index} = opts;
    const colors = _getColorArr(color);
    const dataPoints = _getCuverPoints(points);
    const geometry = new THREE.BufferGeometry().setFromPoints(dataPoints);
    const material = new THREE.LineBasicMaterial({ transparent: true, color: colors[0], opacity: colors[1] });
    // Create the final object to add to the scene
    // -创建线
    group.add(new THREE.Line(geometry, material));
    group.add(_createPoint(points, {index, color}));
    group.add(_createClipPlane(dataPoints, {color}));
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
                directionalLight.position.set(20, 10, 0);
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
                this.container.append(this.renderer.domElement);
                // -添加鼠标事件
                window.addEventListener('resize', this.onWindowResize.bind(this), false);
                this.container[0].addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
                this.container[0].addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
                this.cubes = [];
                this._model = '3D';
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
        self.setRange(self.value);
    }

    setDatas (datas, opts) {
        const self = this;
        if (self.scene) {
            self.scene.add(_createAxios());
            self._point = datas;
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
        self.value = value;
        if (self._model === '3D') {
            self.disposeObject();
            if (self.topFace) {
                publicLabel.disposeObj(self.topFace);
                self.topFace = _createTopFace(_getDataFromRange(self._point, value));
                self.scene.add(self.topFace);
            } else {
                self.topFace = _createTopFace(_getDataFromRange(self._point, value));
                self.scene.add(self.topFace);
            }
            const [startIndex, endIndex] = value;
            for (let i = startIndex; i < endIndex; i++) {
                const zLabel = _createPlaneText({type: 'z', content: '6月' + (i + 1) + '日'});
                zLabel.position.set(-zLabel._size.width / 2 - 1, 0, (i - startIndex) * Z_AXIS_INTERVAL);
                self.zLabels.add(zLabel);
            }
            const {_point} = self;
            let xLabelAdd = false;
            for (let i = startIndex; i < endIndex; i++) {
                const points = [];
                for (let j = 0, dataLength = _point.length; j < dataLength; j++) {
                    const vector = new THREE.Vector3(j * X_AXIS_INTERVAL, _point[j].value[i] * Y_AXIS_MAX_VALUE, (i - startIndex) * Z_AXIS_INTERVAL);
                    points.push(vector);
                    if (!xLabelAdd) {
                        const xLabel = _createPlaneText({
                            type: 'x', content: _point[j].name
                        });
                        xLabel.position.set(j * X_AXIS_INTERVAL, 0, -xLabel._size.width / 2 - 1);
                        self.xLabels.add(xLabel);
                    }
                }
                self.lines.add(_createPolyLine(points, {
                    index: i
                }));
                xLabelAdd = true;
            }
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
        self.camera.position.set(-51.41, 14.25, 28.24);
        self.controls.target.set(1, 15, 29.9);
        self.disposeObject();
        const {_point, value} = self;
        const [startIndex, endIndex] = value;
        const _index = Math.floor(node.faceIndex / 2);
        const pointData = _point[_index];
        const xLabel = _createPlaneText({content: pointData.name});
        xLabel.position.z -= xLabel._size.width / 2 + 1;
        // xLabel.position.y += 2;
        xLabel.rotation.y = -Math.PI / 2;
        self.xLabels.add(xLabel);
        const points = [];
        for (let i = startIndex; i < endIndex; i++) {
            const zLabel = _createPlaneText({content: '6月' + (i + 1) + '日'});
            zLabel.rotation.y = -Math.PI / 2;
            zLabel.position.z = (i - startIndex) * 5;
            zLabel.position.y -= 2;
            self.zLabels.add(zLabel);
            const vector = new THREE.Vector3(0, pointData.value[i] * 20, (i - startIndex) * 5);
            points.push(vector);
        }
        self.lines.add(_createPolyLine(points));
        self._model = '2D';
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
        const self = this;
        const intersects = _pick(event, self);
        if (intersects.length > 0 && intersects[0].object._isHelper) {
            self.container[0].style.cursor = 'pointer';
        } else {
            self.container[0].style.cursor = 'auto';
        }
    }

    onDocumentMouseDown (event) {
        const self = this;
        const intersects = _pick(event, self);
        if (intersects.length > 0 && intersects[0].object._isHelper) {
            // self.pickSprite(intersects[0]);
            self.container[0].style.cursor = 'pointer';
        } else {
            self.container[0].style.cursor = 'auto';
        }
    }
}

export default Initialize;
