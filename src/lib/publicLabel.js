/** 这是一个文件说明
 *@Desc 标签的公共方法
 *@Author Duke
 *@Date 2020/3/16
 */
import {THREE} from './three.min';

const MIN_FONT_SIZE = 12;// -最小字体大小
const SPRITE_FONT_SIZE_RATIO = 2500;// -对sprite标签缩放，可调整
const PLANE_FONT_SIZE_RATIO = 5;// -平面文字换算比例
const FONT_GAP_RATIO = 3.0;// -维度标签放大参数
/**
 * 标签公共方法合集
 */
const publicLabel = {
    getVecCenter:(src, dst)=> {
        return src.clone().lerp(dst, 0.5);
    },
    getValues:(obj)=> {
        return Object.values(obj);
    },
    /**
     * 根据配置项获取dom的字符串
     * @param content
     * @param options
     * @param isBr
     * @param isSpace
     * @returns {string}
     */
    createDivStr: (content, options, isBr, isSpace) => {
        let str = '';
        const textAlign = options.shape ? 'center' : 'left';
        const {fontSize, fontColor, fontWeight} = options;
        const scale = parseFloat(fontSize) >= MIN_FONT_SIZE
            ? 1 : parseFloat(fontSize) / MIN_FONT_SIZE;
        const brStr = isBr ? 'display:inline-block;' : ' word-wrap:normal;';
        const spaceStr = isSpace ? 'text-indent:0.2em;' : '';
        if (options.show !== false) {
            str = `<div style="${spaceStr}${brStr} transform: scale(${scale});
                margin: 0;text-align: ${textAlign};color: ${fontColor};
                font-size: ${parseFloat(fontSize)}px;font-weight: ${fontWeight};line-height: 1em;">${content}</div>`;
        }
        return str;
    },

    /**
     * 三维坐标转二维屏幕坐标
     * @param position
     * @param self
     * @returns {z|z}
     */
    transCoord: (position, self) => {
        const halfW = self.config.element.width / 2;
        const halfH = self.config.element.height / 2;
        const vec3 = position.clone().applyMatrix4(self.scene.matrix).project(self.camera);
        const mx = (vec3.x * halfW + halfW);
        const my = (-vec3.y * halfH + halfH);
        return new THREE.Vector2(mx, my);
    },
    /**
     * //-字符转dom
     * @param arg 构成dom的字符串
     * @returns {dom对象}
     */
    parseDom: (arg) => {
        const objE = document.createElement('div');
        objE.innerHTML = arg;
        return objE.childNodes[0];
    },
    /**
     * 创建2*n次方尺寸的图片
     * @param util
     * @param node
     * @param base64
     * @param isCenter 是否居中或居底
     * @returns {*}
     */
    createCanvasTexture: (node, base64, isCenter) => {
        const imgWidth = node.offsetWidth;
        const imgHeight = node.offsetHeight;// 图片的size
        const width = THREE.Math.ceilPowerOfTwo(imgWidth);
        const height = THREE.Math.ceilPowerOfTwo(imgHeight);// 图片转换之后的size
        const boundary = {
            minX: 0, maxX: 1, minY: 0, maxY: 1
        };
        // - 计算新的图片边界
        if (isCenter) {
            boundary.minX = (width - imgWidth) / (2 * width);
            boundary.maxX = 1 - boundary.minX;
            boundary.minY = (height - imgHeight) / (2 * height);
            boundary.maxY = 1 - boundary.minY;
        } else {
            boundary.minX = (width - imgWidth) / (2 * width);
            boundary.maxX = 1 - boundary.minX;
            boundary.minY = 0;
            boundary.maxY = (imgHeight) / height;
        }
        const textureLoader = new THREE.TextureLoader().load(base64, (texture) => {
            const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            let {image} = texture;
            if (isCenter) {
                context.drawImage(image, (width - imgWidth) / 2, (height - imgHeight) / 2);
            } else {
                context.drawImage(image, (width - imgWidth) / 2, height - imgHeight);
            }
            texture.image = canvas;
            image = null;
        });
        textureLoader._nodeWidth = imgWidth;
        textureLoader._nodeHeight = imgHeight;
        textureLoader._width = width;
        textureLoader._height = height;
        textureLoader._boundary = boundary;
        return textureLoader;
    },
    /**
     * //创建构成线的点数据（3个，相对坐标）
     * @param options lineStyle 标签线样式
     * @param position
     * @param content
     * @returns {[]}
     */
    createLinePoints: (options, position, content) => {
        const arr = [];
        // 折点百分比
        const inflection = options.inflection || 0;
        const length = options.length || 0;
        // -折点距起点长度
        const midLength = inflection * length;
        const restLength = length - midLength;
        const startPoint = new THREE.Vector3();
        const midPoint = new THREE.Vector3();
        const endPoint = new THREE.Vector3();
        arr.push(startPoint, midPoint, endPoint);
        // 计算折点位置与起点的单位向量
        let normalize = new THREE.Vector3(0.5, options._direct, 0).normalize();
        if (options.type !== undefined) {
            normalize = position.clone().setY(0).normalize();
            const tempMidPoint = startPoint.clone()
                .add(normalize.clone().multiplyScalar(midLength));
            const tempEndPoint = tempMidPoint.clone()
                .add(normalize.clone().multiplyScalar(restLength));
            if (options.type < 0.5) {
                midPoint.copy(tempMidPoint);
                endPoint.x = midPoint.x + (position.x < 0 ? -1 : 1) * restLength;
                endPoint.z = midPoint.z;
            } else if (options.type < 1.5) {
                tempMidPoint.y = midLength * Math.sin(Math.PI / 3);
                tempEndPoint.y = tempMidPoint.y;
                midPoint.copy(tempMidPoint);
                endPoint.copy(tempEndPoint);
            } else {
                tempMidPoint.y = midLength * Math.sin(Math.PI / 3);
                tempMidPoint.x = (position.x < 0 ? -1 : 1) * midLength * Math.cos(Math.PI / 3);
                tempMidPoint.z = 0;
                midPoint.copy(tempMidPoint);
                endPoint.x = midPoint.x + (position.x < 0 ? -1 : 1) * restLength;
                endPoint.y = midPoint.y;
            }
        } else if (options.position !== undefined) { // -柱状图、面积图及漏斗图等的计算
            const {topRadius, bottomRadius} = content;
            const centerRadius = (topRadius + bottomRadius) / 2;
            const isRight = options.position === 'right';
            options._direct = content.sort === 'rise' ? 1 : -1;
            const isCone = content.topType === 'cone';
            normalize = new THREE.Vector3(isRight ? 0.5 : -0.5, options._direct, 0).normalize();
            if (isCone) {
                arr[0].x = isRight ? centerRadius : -centerRadius;
                arr[1] = new THREE.Vector3(arr[0].x + (isRight ? midLength : -midLength),
                    arr[0].y, arr[0].z);
                arr[2] = arr[1].clone().add(normalize.multiplyScalar(restLength));
            } else {
                arr.push(new THREE.Vector3());
                arr[1].x = isRight ? bottomRadius : -bottomRadius;
                arr[2] = new THREE.Vector3(arr[1].x + (isRight ? midLength : -midLength),
                    arr[1].y, arr[1].z);
                arr[3] = arr[2].clone().add(normalize.multiplyScalar(restLength));
            }
        } else {
            // 计算折点
            arr[1] = startPoint.clone().add(normalize.multiplyScalar(midLength));
            arr[2] = new THREE.Vector3(arr[1].x + restLength, arr[1].y, arr[1].z);
        }
        return arr;
    },
    isArray(o) {
        return Object.prototype.toString.call(o) == '[object Array]';
    },

    getColorArr(str) {
        if (publicLabel.isArray(str)) return str;
        var _arr = [];
        str = str + '';
        str = str.toLowerCase().replace(/\s/g, "");
        if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
            var arr = str.replace(/rgba\(|\)/gi, '').split(',');
            var hex = [
                pad2(Math.round(arr[0] * 1 || 0).toString(16)),
                pad2(Math.round(arr[1] * 1 || 0).toString(16)),
                pad2(Math.round(arr[2] * 1 || 0).toString(16))
            ];
            _arr[0] = new THREE.Color('#' + hex.join(""));
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
    /**
     * //绘制线
     * @param points 构成线的点集
     * @param options 线配置项 lineStyle
     * @returns {THREE.Line}
     */
    createLine: (points, options) => {
        const geometry = new THREE.Geometry();
        geometry.vertices = points.concat();
        const colors = publicLabel.getColorArr(options.color);
        const material = new THREE.LineBasicMaterial({
            color: colors[0],
            transparent: true,
            opacity: colors[1],
            depthTest: options.position !== undefined
        });
        material.userData = {opacity: colors[1]};
        const line = new THREE.Line(geometry, material);
        const lineVisible = (options.show !== false && options.length > 0);
        if ((options.type === undefined || options.type < 1.5) && options.position === undefined) {
            line._fixType = options.type;
            line._points = points;
            line._isLabelLine = true;
            line.visible = lineVisible;
            line._direction = points[2].x > points[0].x ? 1 : 2;
            return line;
        }
        const group = new THREE.Object3D();
        group._fixType = options.type;
        group._points = points;
        group._isLabelLine = true;
        group.visible = lineVisible;
        group._direction = points[2].x > points[0].x ? 1 : 2;
        group.add(line);
        return group;
    },
    // -计算sprite的锚点
    calSpriteCenter: (options) => {
        const HALF_ONE = 0.5;// -中点计算参数
        const {
            lineStyle, type, shapeType, position, boundary, content
        } = options;
        const centerX = (boundary.minX + boundary.maxX) / 2;
        const centerY = (boundary.minY + boundary.maxY) / 2;
        const center = new THREE.Vector2();
        if (lineStyle.show === false) {
            switch (type) {
                case 'bar':
                case 'pie':
                    center.set(centerX, boundary.minY);
                    break;
                case 'area':
                    if (shapeType < HALF_ONE) center.set(centerX, boundary.minY);
                    else if (position.y >= 0) center.set(centerX, centerY * HALF_ONE);
                    else center.set(centerX, boundary.maxY - centerY * HALF_ONE);
                    break;
                case 'funnel':
                    if (lineStyle.position === 'right') {
                        if (content.sort === 'rise') center.set(boundary.minX, boundary.minY);
                        else center.set(boundary.minX, boundary.maxY);
                    } else if (content.sort === 'rise') center.set(boundary.maxX, boundary.minY);
                    else center.set(boundary.maxX, boundary.maxY);
                    break;
                default:
                    break;
            }
        } else if (lineStyle.position === 'left') {
            if (lineStyle.length > 0) center.set(boundary.maxX, centerY);
            else if (content.sort === 'rise') center.set(boundary.maxX, boundary.minY);
            else center.set(boundary.maxX, boundary.maxY);
        } else if (lineStyle.position === 'right') {
            if (lineStyle.length > 0) center.set(boundary.minX, centerY);
            else if (content.sort === 'rise') center.set(boundary.minX, boundary.minY);
            else center.set(boundary.minX, boundary.maxY);
        } else center.set(boundary.minX, centerY);
        return center;
    },
    /**
     * 获取标签的相对坐标
     * @param linePoints
     * @param lineStyle
     * @param isCone
     * @returns {*}
     * @private
     */
    getSpritePosition: (linePoints, lineStyle, isCone) => {
        let position = new THREE.Vector3();
        if (lineStyle.show === false) {
            if (lineStyle.position && !isCone) position = linePoints[1].clone();
            else position = linePoints[0].clone();
        } else if (lineStyle.position && !isCone) position = linePoints[3].clone();
        else position = linePoints[2].clone();
        return position;
    },
    /**
     * //绘制标签
     * @returns {THREE.Object3D}
     * @param options 用于绘制立体标签的配置项
     */
    createSprite: (options) => {
        const {
            domStr/* 标签dom结构字符串 */, content/* 标签内容 */,
            lineStyle/* 标签线参数 */, type/* 标签所属的图形类型 */,
            shapeType/* 图标类型 */, position/* 标签位置 */,index/*标签序号*/
        } = options;
        const node = publicLabel.parseDom(domStr);// 字符转node
        document.body.appendChild(node);// 先加到body下面计算宽高值
        const group = new THREE.Object3D();
        screenCut(node, (base64) => {
            /** ****************** 标签线 *************** */
            // -先计算绘制标签线需要的点
            lineStyle.position = index%2!==0?'left':'right';
            const linePoints = publicLabel.createLinePoints(lineStyle || {},
                position, content);
            const line = publicLabel.createLine(linePoints, lineStyle);
            line.renderOrder = 1;
            const spritePosition = publicLabel.getSpritePosition(linePoints, lineStyle,
                content && content.topType === 'cone');
            line._rotationPoint = spritePosition.clone();
            group.add(line);
            /** ***************** 标签 ******************* */
            const spriteMap = publicLabel.createCanvasTexture(node, base64, type !== 'area');
            const boundary = spriteMap._boundary;
            const spriteMaterial = new THREE.SpriteMaterial({
                map: spriteMap,
                color: 0xffffff,
                transparent: true,
                depthTest: false,
                sizeAttenuation: false
            });
            spriteMaterial.userData = {
                opacity: 1
            };
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite._boundary = spriteMap._boundary;
            sprite._midPoint = linePoints[1].clone();
            sprite._endPoint = linePoints[2].clone();
            sprite.renderOrder = 100;
            sprite.userData = {
                content, node
            };
            const width = spriteMap._width;
            const height = spriteMap._height;// 图片的size
            sprite.scale.set(width / SPRITE_FONT_SIZE_RATIO, height / SPRITE_FONT_SIZE_RATIO, 1);
            sprite.center.copy(publicLabel.calSpriteCenter({
                lineStyle, type, shapeType, boundary, position, content
            }));
            sprite.position.copy(spritePosition);
            group.add(sprite);
        });
        document.body.removeChild(node);// 使用完毕丢弃
        return group;
    },
    disposeObj(obj) {
        if (obj instanceof THREE.Object3D) {
            this.objectTraverse(obj, publicLabel.disposeNode.bind(publicLabel));
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
            node.material.forEach(publicLabel.disposeMaterial.bind(publicLabel));
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
            publicLabel.objectTraverse(children[i], callback);
        }
        callback(obj);
    }
};
export default publicLabel;
