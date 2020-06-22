/** 这是一个文件说明
 *@Desc 标签的公共方法
 *@Author Duke
 *@Date 2020/3/16
 */
import { THREE } from './three.min';
import _Shaders from '../assets/shaders';
import pointImg from '../assets/point.png';

const LINE_POINTS_COUNT_UNIT = 100;
const PLANE_FONT_SIZE_RATIO = 30;// -平面文字换算比例
const X_AXIS_INTERVAL = 2;// -x轴间距
const Z_AXIS_INTERVAL = 5;// -z轴间距
const Y_AXIS_MAX_VALUE = 10;

/**
 * 标签公共方法合集
 */
const PublicFunc = {
    getVecCenter: (src, dst) => {
        return src.clone().lerp(dst, 0.5);
    },
    getValues: (obj) => {
        return Object.values(obj);
    },
    transCoord: (position, self) => {
        const halfW = self.container.width() / 2;
        const halfH = self.container.height() / 2;
        const vec3 = position.clone().applyMatrix4(self.scene.matrix).project(self.camera);
        const mx = (vec3.x * halfW + halfW);
        const my = (-vec3.y * halfH + halfH);
        return new THREE.Vector2(mx, my);
    },
    randomColor() { // 十六进制颜色随机
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const color = ('#' + r.toString(16) + g.toString(16) + b.toString(16) + '000').slice(0, 7);
        return color;
    },
    isArray(o) {
        return Object.prototype.toString.call(o) == '[object Array]';
    },

    getColorArr(str) {
        if (PublicFunc.isArray(str)) return str;
        var _arr = [];
        str = str + '';
        str = str.toLowerCase().replace(/\s/g, '');
        if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
            var arr = str.replace(/rgba\(|\)/gi, '').split(',');
            var hex = [
                pad2(Math.round(arr[0] * 1 || 0).toString(16)),
                pad2(Math.round(arr[1] * 1 || 0).toString(16)),
                pad2(Math.round(arr[2] * 1 || 0).toString(16))
            ];
            _arr[0] = new THREE.Color('#' + hex.join(''));
            _arr[1] = Math.max(0, Math.min(1, (arr[3] * 1 || 0)));
        } else if ('transparent' === str) {
            _arr[0] = new THREE.Color();
            _arr[1] = 0;
        } else {
            _arr[0] = new THREE.Color(str);
            _arr[1] = 1;
        }

        function pad2(c) {
            return c.length == 1 ? '0' + c : '' + c;
        }

        return _arr;
    },
    createAxis(point) {
        point = point || new THREE.Vector3();
        const positions = [];
        const colors = [];
        positions.push(0,0,0,(point.x + 1) * X_AXIS_INTERVAL,0,0);
        positions.push(0,0,0,0,Math.ceil(point.y) * Y_AXIS_MAX_VALUE,0);
        positions.push(0,0,0,0,0,(point.z+1)*Z_AXIS_INTERVAL);
        colors.push(1,0,0,1,0,0);
        colors.push(0,1,0,0,1,0);
        colors.push(0,0,1,0,0,1);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        lineGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        const lineMaterial = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
        const line = new THREE.LineSegments(lineGeometry,lineMaterial);
        return line;
    },
    createTextCanvas(content, color) {
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
        context.fillStyle =  color || 'white';
        context.lineWidth = 10;
        context.fillText(content, width / 2, height / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture._size = { width, height, realWidth: wh.width };
        canvas = null;
        return texture;
    },
    createPlaneText(opts, mEvent) {
        opts = opts || {};
        const { type = '', content = '', index, color = '#FFFFFF',ratio = 1 } = opts;
        const texture = this.createTextCanvas(content);
        const { _size } = texture;
        const { width, height, realWidth } = _size;
        const colors = this.getColorArr(color);
        const geometry = new THREE.PlaneGeometry(ratio * width / PLANE_FONT_SIZE_RATIO, ratio * height / PLANE_FONT_SIZE_RATIO);
        let matrix = new THREE.Matrix4();
        if (type === 'x') {
            matrix = matrix.multiply(new THREE.Matrix4().makeRotationX(
                -Math.PI / 2
            ));
            matrix = matrix.multiply(new THREE.Matrix4().makeRotationZ(
                -Math.PI / 2
            ));
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
            map: texture, transparent: true, side: THREE.DoubleSide,
            color: colors[0], opacity: colors[1],side:THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { color: colors[0], content };
        mesh._size = { width: realWidth / PLANE_FONT_SIZE_RATIO };
        mesh._index = index;
        mesh._isLabel = true;
        mesh._isPlane = true;
        mesh._type = type;
        mEvent.push(mesh);
        return mesh;
    },
    createSpriteText(opts) {
        const { content = '',center = new THREE.Vector2(1,0.5), type = 'y'} = opts;
        const group = new THREE.Object3D();
        // -创建线
        const lineGeometry = new THREE.Geometry();
        const vertices = [];
        vertices.push(new THREE.Vector3());
        if(type === 'y')vertices.push(new THREE.Vector3(-0.2, 0, -0.2));
        else if(type === 'x')vertices.push(new THREE.Vector3(0,0,-0.2));
        else if(type === 'z')vertices.push(new THREE.Vector3(-0.2,0,0));
        lineGeometry.vertices = vertices;
        const lineMaterial = new THREE.LineBasicMaterial();
        const line = new THREE.LineSegments(lineGeometry, lineMaterial);
        group.add(line);
        // -创建标签
        
        const texture = this.createTextCanvas(content);
        const { _size } = texture;
        const { width, height, realWidth } = _size;
        const spriteMaterial = new THREE.SpriteMaterial({depthTest:false, map: texture, color: 0xffffff, sizeAttenuation: false });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.0005 * width, 0.0005 * height, 0.03);
        sprite.center.set(center.x, center.y);
        sprite._isSprite = true;
        sprite.position.copy(vertices[1]);
        group.add(sprite);
        

        return group;
    },
    createClipPlane(points, opts) {
        opts = opts || {};
        const { size = 1, color = '#b2a53d', type } = opts;
        const dataPoints = this.getCurvePoints(points, type);
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
        const colors = this.getColorArr(color);
        const material = new THREE.MeshBasicMaterial({
            color: colors[0],
            opacity: 0.1,
            transparent: true,
            side: THREE.DoubleSide,
            wireframe: false
            // depthTest: false
        });

        return new THREE.Mesh(geometry, material);
    },
    getDatasValueRange(datas) {
        const result = { maxValue: -Infinity, minValue: Infinity };
        datas.forEach(data => {
            data.content.forEach(content => {
                if (result.maxValue < content.value) result.maxValue = content.value;
                if (result.minValue > content.value) result.minValue = content.value;
            });
        });
        return result;
    },
    getDataFromRange(datas, value) {
        const [startIndex, endIndex] = value;
        const result = [];
        datas.forEach(data => {
            const pointData = {};
            pointData.name = data.name;
            pointData.content = data.content.slice(startIndex, endIndex + 1);
            result.push(pointData);
        });
        return result;
    },

    getPointsFromDatas(datas) {
        const result = [];
        const valueRange = this.getDatasValueRange(datas);
        datas.forEach((data, dataIndex) => {
            const points = [];
            result.push(points);
            data.content.forEach((content, valueIndex) => {
                const vector = new THREE.Vector3(valueIndex * X_AXIS_INTERVAL + 3,
                    (content.value - 0.5) * Y_AXIS_MAX_VALUE,
                    (dataIndex) * Z_AXIS_INTERVAL + 3);
                points.push(vector);
            });
        });
        return result;
    },
    createAxesLine(point) {
        const geometry = new THREE.Geometry();
        const vertices = [];
        vertices.push(new THREE.Vector3(point.x, 0, 0));
        vertices.push(new THREE.Vector3(point.x, 0, point.z));
        vertices.push(new THREE.Vector3(point.x, 0, point.z));
        vertices.push(new THREE.Vector3(0, 0, point.z));
        vertices.push(new THREE.Vector3(point.x, 0, point.z));
        vertices.push(point);
        geometry.vertices = vertices;
        const material = new THREE.LineBasicMaterial({ transparent: true, color: '#FFFF00', depthTest: false });
        return new THREE.LineSegments(geometry, material);
    },

    getCurveFromLine(type, index, lines) {
        let curve = null;
        lines.traverse(line => {
            if (line._isLine) {
                if (line._type === type && line._index === index) {
                    curve = line._curve;
                }
            }
        });
        return curve;
    },
    createFatLine(curve) {
        var geometry = new THREE.TubeBufferGeometry(curve, LINE_POINTS_COUNT_UNIT, 0.1, 16, false);
        var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        return new THREE.Mesh(geometry, material);
    },
    getCurvePoints(points, type) {
        const newPoints = points.concat();
        if (type) {
            const startPoint = newPoints[0].clone();
            startPoint.setY(0);
            const endPoint = newPoints[newPoints.length - 1].clone();
            endPoint.setY(0);
            type === 'x' ? startPoint.setX(0) : startPoint.setZ(0);
            // newPoints.unshift(startPoint);
            // newPoints.push(endPoint);
        }
        if (newPoints.length < 2) newPoints.push(newPoints[0]);

        const curve = new THREE.CatmullRomCurve3(newPoints);
        return curve.getPoints(LINE_POINTS_COUNT_UNIT);
    },

    changeLineColor(type, index, lines) {
        lines.traverse(line => {
            if (line._isLine) {
                if (line._type === type && line._index === index) {
                    line.material.color = new THREE.Color('#FF0000');
                } else {
                    line.material.color = line.userData.color;
                }
            }
        });
    },

    getMaxMinValuePoint(type,index,lines){
        const group = new THREE.Object3D();
        const maxPosition = new THREE.Vector3();
        maxPosition.y = -Infinity;
        const minPosition = new THREE.Vector3();
        minPosition.y = Infinity;
        lines.traverse(line=>{
            if(line._isPoints && !line._isHelper){
                if(type !== undefined && index !== undefined){
                    if(line._type === type && line._index === index){
                        if(maxPosition.y <= line.position.y)maxPosition.copy(line.position);
                        if(minPosition.y >= line.position.y)minPosition.copy(line.position);
                    }
                }else{
                    if(maxPosition.y <= line.position.y)maxPosition.copy(line.position);
                    if(minPosition.y >= line.position.y)minPosition.copy(line.position);
                }                
            }
        });
        return { maxPosition, minPosition};
    },

    createUpLineTip(opts){
        const { content, position, color = '#FFFFFF', maxHeight = 20} = opts;
        const group = new THREE.Object3D();
        // -线
        const lineGeometry = new THREE.Geometry();
        const vertices = [];
        vertices.push(position);
        vertices.push(position.clone().setY(maxHeight));
        lineGeometry.vertices = vertices;
        const lineMaterial = new THREE.LineBasicMaterial({color});
        const line = new THREE.LineSegments(lineGeometry,lineMaterial);
        group.add(line);
        // -tips
        const texture = this.createTextCanvas(content);  
        const { _size } = texture;
        const { width, height} = _size;           
        const spriteMaterial = new THREE.SpriteMaterial({depthTest:false, map: texture, color, sizeAttenuation: false,transparent:true });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.001 * width, 0.001 * height, 1);
        sprite.center.set(0.5, 0);
        sprite.position.copy(vertices[1]);
        group.add(sprite);
        return group;
    },

    createPolyLine(points, opts, mEvent) {
        const group = new THREE.Object3D();
        opts = opts || {};
        const { color = '#fffbfa', type, index, localPlane, withPoint } = opts;
        const colors = this.getColorArr(color);
        const dataPoints = this.getCurvePoints(points, type);
        const curve = new THREE.CatmullRomCurve3(points);
        dataPoints.forEach(point => {
            point.y += 0.01;
        });
        // -创建线
        const geometry = new THREE.BufferGeometry().setFromPoints(dataPoints);
        const material = new THREE.LineBasicMaterial({
            transparent: true,
            color: colors[0],
            opacity: colors[1],
            clippingPlanes: [localPlane]
        });
        const lineMesh = new THREE.Line(geometry, material);
        lineMesh._type = type;
        lineMesh._index = index;
        lineMesh._isLine = true;
        lineMesh._curve = curve;
        lineMesh.userData = { color: colors[0], opacity: colors[1] };
        group.add(lineMesh);
        // -创建点
        group.add(this.createPoint(points, { index, type, localPlane, withPoint }, mEvent));

        return group;
    },
    getCurvePointsFromDatas(datas) {
        const points = [];
        const valueRange = this.getDatasValueRange(datas);
        datas.forEach((data, dataIndex) => {
            const curvePoints = [];
            data.content.forEach((content, valueIndex) => {
                curvePoints.push(new THREE.Vector3(X_AXIS_INTERVAL * valueIndex + 3,
                    (content.value - 0.5) * Y_AXIS_MAX_VALUE, Z_AXIS_INTERVAL * dataIndex + 3));
            });
            points.push(this.getCurvePoints(curvePoints, 'z'));
        });
        const result = [];
        for (let i = 0, length = points[0].length; i < length; i++) {
            const curverPoints = [];
            for (let j = 0, dataLength = points.length; j < dataLength; j++) {
                curverPoints.push(points[j][i]);
            }
            result.push(this.getCurvePoints(curverPoints, 'x'));
        }
        return result;
    },
    createTopFace(datas, opts) {
        opts = opts || {};
        const { localPlane } = opts;
        const points = this.getCurvePointsFromDatas(datas);
        const valueRange = this.getDatasValueRange(datas);
        const geometry = new THREE.PlaneBufferGeometry(1, 1, points.length - 1, points[0].length - 1);
        const { position } = geometry.attributes;
        for (let i = 0, length = points.length; i < length; i++) {
            for (let j = 0, hLength = points[i].length; j < hLength; j++) {
                position.array[3 * (i * hLength + j)] = points[i][j].x;
                position.array[3 * (i * hLength + j) + 1] = points[i][j].y;
                position.array[3 * (i * hLength + j) + 2] = points[i][j].z;
            }
        }
        position.needsUpdate = true;
        // vertexColors.needsUpdate = true;
        geometry.computeVertexNormals();
        const glColors = [
            new THREE.Color('#E8100C'),
            new THREE.Color('#E8B70C'),
            new THREE.Color('#B7E80C'),
            new THREE.Color('#0CE84C'),
            new THREE.Color('#345F92'),
            new THREE.Color('#1D0098')
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
                    value: Y_AXIS_MAX_VALUE * (valueRange.maxValue - valueRange.minValue)
                },
                u_maxHeight:{
                    value:(valueRange.maxValue - 0.5) * Y_AXIS_MAX_VALUE
                },
                u_minHeight:{
                    value:(valueRange.minValue - 0.5) * Y_AXIS_MAX_VALUE
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
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    },
    setPointsVisible(type, index, lines) {
        lines.traverse(line => {
            if (line._isPoints) {
                if (line._type === type && line._index === index) line.visible = true;
                else line.visible = false;
            }
        });
    },
    createPoint(points, opts, mEvent) {
        opts = opts || {};
        const { pointSize = 1, index, color = '#FFFFFF', type, localPlane, withPoint } = opts;
        const pointCloud = new THREE.Object3D();
        pointCloud._index = index;
        const texture = new THREE.TextureLoader().load(pointImg);
        const cGeo = new THREE.Geometry();
        const Build = new THREE.Mesh(cGeo.clone());
        const colors = PublicFunc.getColorArr(color);

        points.forEach((point) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                color: colors[0],
                transparent: true,
                opacity: 1.0,
                clippingPlanes: [localPlane]
            }));
            sprite.position.copy(point);
            sprite.position.y += 0.2;
            sprite.scale.set(pointSize, pointSize, pointSize);
            sprite._index = index;
            sprite._type = type;
            sprite._color = colors[0];
            sprite._isPoints = true;
            sprite.visible = false;
            pointCloud.add(sprite);
            Build.geometry = new THREE.PlaneGeometry(pointSize * 2, pointSize * 2);
            Build.position.copy(point);
            Build.updateMatrix();
            cGeo.merge(Build.geometry, Build.matrix);
        });
        if (withPoint) {
            const obj = new THREE.Mesh(cGeo, new THREE.MeshLambertMaterial({
                transparent: true,
                opacity: 0.0,
                depthWrite: false,
                side: THREE.DoubleSide
            }));
            obj._isHelper = true;
            obj._index = index;
            obj._type = type;
            obj._isPoints = true;
            mEvent.push(obj);
            pointCloud.add(obj);
        }
        const obj = new THREE.Mesh(cGeo, new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
            side: THREE.DoubleSide
        }));
        obj._isHelper = true;
        obj._index = index;
        obj._type = type;
        mEvent.push(obj);
        pointCloud.add(obj);
        return pointCloud;
    },
    disposeObj(obj) {
        if (obj instanceof THREE.Object3D) {
            this.objectTraverse(obj, PublicFunc.disposeNode.bind(PublicFunc));
        }
    },
    /**
     * [disposeNode 删除单个节点]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    disposeNode(node) {
        if (node._txueArr && node._txueArr[1]) {
            node._txueArr[1].dispose();
            node._txueArr[2].dispose();
            node._txueArr[1] = null;
            node._txueArr[2] = null;
        }
        this.deleteGeometry(node);
        this.deleteMaterial(node);
        node.dispose && node.dispose();
        if (node.parent) node.parent.remove(node);
        node = null;
    },
    /**
     * [deleteGeometry 删除几何体]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    deleteGeometry(node) {
        if (node.geometry && node.geometry.dispose) {
            if (node.geometry._bufferGeometry) {
                node.geometry._bufferGeometry.dispose();
            }

            node.geometry.dispose();
            node.geometry = null;
        }
    },
    /**
     * [deleteMaterial 删除材质，多材质]
     * @Author   ZHOUPU
     * @DateTime 2019-05-14
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    deleteMaterial(node) {
        if (this.isArray(node.material)) {
            node.material.forEach(PublicFunc.disposeMaterial.bind(PublicFunc));
        } else if (node.material) {
            this.disposeMaterial(node.material);
        }
        node.material = null;
    },
    /**
     * [disposeMaterial 销毁材质]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj      [THREE的材质对象]
     * @return   {[void]}
     */
    disposeMaterial(mtl) {
        if (mtl.uniforms && mtl.uniforms.u_txue && mtl.uniforms.u_txue.value) {
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.u_txue.value.dispose();
                mtl.__webglShader.uniforms.u_txue.value = null;
            } else {
                mtl.uniforms.u_txue.value.dispose();
                mtl.uniforms.u_txue.value = null;
            }
        }
        if (mtl.map) {
            mtl.map.dispose();
            mtl.map = null;
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.map.value.dispose();
                mtl.__webglShader.uniforms.map.value = null;
            }
        }
        mtl.dispose();
        mtl = null;
    },
    /**
     * [objectTraverse 遍历对象树，由叶到根]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj      [THREE的object3D对象]
     * @param    {Function} callback [回调函数，返回遍历对象]
     * @return   {[void]}
     */
    objectTraverse(obj, callback) {
        const { children } = obj;
        for (let i = children.length - 1; i >= 0; i--) {
            PublicFunc.objectTraverse(children[i], callback);
        }
        callback(obj);
    }
};
export default PublicFunc;
