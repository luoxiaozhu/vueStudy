export default {
    ClipPlaneVShader: ``,
    ClipPlaneFShader: ``,
    TopFaceVShader: `uniform float u_time; 
        varying vec3 v_normal;
        varying float _y; 
        varying vec3 va_position; 
        
        void main() { 
            vec3 v_position = vec3(position.r,mix(0.0,position.y,u_time), position.z);
            // v_position.y = v_position.z <= u_z ? 0.0:v_position.y;
            // v_position.y = v_position.x <= u_x ? 0.0:v_position.y;
            _y = v_position.y;   
            va_position = v_position;         
            vec4 mvPosition = modelViewMatrix * vec4(v_position, 1.0); 
            v_normal = _y == 0.0 ? vec3(.0,.0,.0) :normalMatrix * normal;             
            gl_Position = projectionMatrix * mvPosition;
        }`,
    TopFaceFShader: `uniform vec3 colorArr[NUM_DISTINCT];        
        uniform float colorNum;
        uniform float height;        
        uniform float u_maxHeight;
        uniform float u_minHeight;
        uniform vec3 u_lightDirection;
        uniform vec3 u_lightColor;
        uniform vec3 u_AmbientLight; 
        uniform float u_x;
        uniform float u_z; 
       
        varying vec3 v_normal;
        varying float _y;   
        varying vec3 va_position;           
             
        void main() {            
            vec3 tt_color = vec3(1.0,0.0,0.0);
            float curI = _y / height;
            if (colorNum != 0.0) {
                float baseH = height / colorNum;
                float colorMod = mod(_y - u_minHeight , baseH);
                int bcolorIndex = int(floor((u_maxHeight - _y) / baseH));
                for (int i = 0; i < NUM_DISTINCT; i++){
                    vec3 t_color = colorArr[i];
                    int index = int(i - 1);
                    if (index < NUM_DISTINCT && i == bcolorIndex) {
                        vec3 d_color = colorArr[i - 1];
                        if (i == 0) {
                            d_color = t_color;
                        } 
                        float t_i = colorMod / baseH; 
                        float r = mix(t_color.r, d_color.r, t_i);
                        float g = mix(t_color.g, d_color.g, t_i);
                        float b = mix(t_color.b, d_color.b, t_i);  
                        tt_color = vec3(r, g, b);
                    }  
                };
            } 
            if(va_position.x < u_x || va_position.z < u_z)discard;
            
            vec3 dst_color = _y < 1.0 ? colorArr[NUM_DISTINCT - 1] : tt_color;
            vec3 normal = normalize(v_normal);
            float nDotL = max(dot(u_lightDirection, normal), 0.0);
            vec3 diffuse = u_lightColor * dst_color * nDotL;
            vec3 ambient = u_AmbientLight * dst_color;
            vec3 gcolor = diffuse + ambient;
            gl_FragColor = vec4(gcolor, 1.0);
        }`
};
