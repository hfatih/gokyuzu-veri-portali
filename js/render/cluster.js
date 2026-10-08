// Yıldız kümesi sahnesi (glview.js üzerinde, durağan): her üye bir nokta sprite'ı. Gökyüzündeki
// konumu gerçek (teğet düzlem izdüşümü), derinliği bilinmediği için izotropik dağılımdan örneklenir.
// Renk (B−V)₀'dan sıcaklık → kara cisim, parlaklık M_V'den.

const VERT = `#version 300 es
in vec3 aPos;
in vec3 aCol;
in float aLum;
uniform vec2 uRes, uShift;
uniform vec3 uCamPos;
uniform float uTanFov, uPx;
out vec3 vCol;
out float vLum;
void main() {
  vec3 fw = normalize(-uCamPos), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  vec3 v = aPos - uCamPos;
  float z = dot(v, fw);
  vec2 uv = vec2(dot(v, rt), dot(v, up)) / (z * uTanFov);
  gl_Position = z > 0.05 ? vec4((uv.x + uShift.x) * uRes.y / uRes.x, uv.y + uShift.y, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  // Görünen parlaklık uzaklığın karesiyle düşer; nokta boyu parlaklığın kareköküyle büyür (sınırlı)
  float b = aLum / (z * z);
  gl_PointSize = clamp(sqrt(b) * uPx, 1.5, 28.0);
  vCol = aCol;
  vLum = b / max(gl_PointSize * gl_PointSize * 0.1, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vCol;
in float vLum;
out vec4 outColor;
uniform float uExposure;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float g = exp(-dot(d, d) * 18.0);
  vec3 c = vCol * vLum * g * uExposure;
  outColor = vec4(c, 1.0);
}`;

/** Küme sahnesi. params: clusterVisualParams() (cluster/visual.js). */
export const clusterScene = {
  id: 'cluster',
  vert: VERT,
  frag: FRAG,
  static: true,
  init(gl, view, U) {
    return { vao: gl.createVertexArray(), buf: gl.createBuffer(), data: null, n: 0 };
  },
  uniforms(gl, U, p, view) {
    gl.uniform1f(U.uPx, 6 * (view.canvas.height / 800));
  },
  draw(gl, p, view, st) {
    const prog = gl.getParameter(gl.CURRENT_PROGRAM);
    gl.bindVertexArray(st.vao);
    if (st.data !== p.data) {
      // Her yıldız: x, y, z, r, g, b, parlaklık (7 float)
      gl.bindBuffer(gl.ARRAY_BUFFER, st.buf);
      gl.bufferData(gl.ARRAY_BUFFER, p.data, gl.STATIC_DRAW);
      const attr = (name, size, off) => {
        const loc = gl.getAttribLocation(prog, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 28, off);
      };
      attr('aPos', 3, 0); attr('aCol', 3, 12); attr('aLum', 1, 24);
      st.data = p.data; st.n = p.data.length / 7;
    }
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);   // ışık toplanır
    gl.drawArrays(gl.POINTS, 0, st.n);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  },
  timeScale: () => 0,
};
