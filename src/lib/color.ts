function interpolateRange(l: number, u: number, p: number) {
  return l + (u - l) * p;
}

function interpolate(gradient: Gradient, p: number) : Color {
  // Figure out sub-range for p
  // Feels like there's a cleaner way of doing this
  let range = Object.keys(gradient).sort((a, b) => parseFloat(a) - parseFloat(b)).map((k) => parseFloat(k));
  let u = range.filter((s) => s >= p)[0];
  let l = range[range.indexOf(u) - 1];
  if (!l) {
    l = u;
    u = range[range.indexOf(l) + 1];
  }

  // Convert p for this range
  p = (p - l)/(u - l);
  let [l_r, l_g, l_b] = hexToRGB(gradient[l]);
  let [u_r, u_g, u_b] = hexToRGB(gradient[u]);
  let r = interpolateRange(l_r, u_r, p);
  let g = interpolateRange(l_g, u_g, p);
  let b = interpolateRange(l_b, u_b, p);
  return [r, g, b];
}

function multiply(a: Color, b: Color) : Color {
  return [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
}

function hexToRGB(hex: string) : Color {
  let h = parseInt(hex.substring(1), 16);
  return [
    ((h >> 16) & 255)/255,
    ((h >> 8) & 255)/255,
    (h & 255)/255
  ];
}

function RGBToCSS(color: Color) {
  return `rgb(${color[0]*255}, ${color[1]*255}, ${color[2]*255})`;
}

function RGBToHex(color: Color) {
  let [r,g,b] = color;
  return b*255 | ((g*255) << 8) | ((r*255) << 16);
}

export default {
  interpolate, multiply,
  hexToRGB, RGBToCSS, RGBToHex
}
