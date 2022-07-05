---
name: skin
type: fragment
author: Nathaniel Carter
uniform.alpha: { "type": "1f", "value": 1.0 }
uniform.radius: { "type": "1f", "value": 0.07 }
uniform.cells: { "type": "2fv", "value": [] }
uniform.color: { "type": "3fv", "value": [1.0, 1.0, 1.0] }
---

precision mediump float;

const int MAX_SHADER_CELLS = 100;

uniform float radius;
uniform float alpha;
uniform vec3 color[1];
uniform vec2 cells[MAX_SHADER_CELLS];

uniform vec2 resolution;

varying vec2 fragCoord;

void main(void) {
    vec4 outColor = vec4(0.);
    vec2 st = fragCoord.xy / resolution.xy;


    // this looks cool but is too expensive to calculate
    // for(int i = 0; i < MAX_SHADER_CELLS; i++) {
    //     vec2 cell = cells[i];
    //     if (cell.xy != vec2(-1.)) {
    //         float closestDist = 1.0;
    //
    //         for(int j = 0; j < MAX_SHADER_CELLS; j++) {
    //             vec2 cell2 = cells[j];
    //             if (cell2.xy != vec2(-1.)) {
    //                 float dist2 = distance(st.xy, cell2.xy);
    //
    //                 if (dist2 < closestDist) {
    //                     closestDist = dist2;
    //                 }
    //             }
    //         }
    //
    //
    //         if (closestDist < radius) {
    //             float brightness = 0.55 + min((radius - closestDist) / radius, 0.2);
    //
    //             color = alpha * vec4(brightness * 1.0, brightness * 0.85, brightness * 0.75, 1.0);
    //         }
    //     }
    // }

    for(int i = 0; i < MAX_SHADER_CELLS; i++) {
        vec2 cell = cells[i];
        if (cell.xy != vec2(-1.)) {
            float dist = distance(st.xy, cell.xy);
            //
            if (dist < radius) {
                float brightness = 1.0 + radius;

                outColor = alpha * vec4(brightness * color[0], 1.0);
            }
        }
        /* Do Some Calculation */
    }

    gl_FragColor = vec4(outColor);
    // gl_FragColor = vec4(0.4,0.4,0.4,0.4);
}

---
name: ocean
type: fragment
author: Nathaniel Carter
uniform.offset: { "type": "2fv", "value": [0.0, 0.0] }
---

precision mediump float;

uniform float     time;
uniform vec2      resolution;
uniform vec2      offset[1];

float length2(vec2 p) { return dot(p, p); }

float noise(vec2 p){
    return fract(sin(fract(sin(p.x) * (43.13311)) + p.y) * 31.0011);
}

float worley(vec2 p) {
    float d = 1e30;
    for (int xo = -1; xo <= 1; ++xo) {
        for (int yo = -1; yo <= 1; ++yo) {
            vec2 tp = floor(p) + vec2(xo, yo);
            d = min(d, length2(p - tp - vec2(noise(tp))));
        }
    }
    return 3.0*exp(-4.0*abs(2.0 * d - 1.0));
}

float fworley(vec2 p, vec2 o) {

    return sqrt(sqrt(sqrt(sqrt(
        1.1 * // light
        sqrt(worley((50.0) * p + o + time * 0.45 / 50.0)) // bottom layer // + time * -0.025
        * sqrt(worley(25.0 * p + o + time * 0.45 / 25.0)) // layer 1
        * sqrt(worley(10.0 * p + o + time * 0.45 / 10.0)) // layer 2
        * worley(4.0 * p + o + time * 0.25 / 4.0) // layer 3

        // worley(5.0 * p + o + time * 0.0525) * // light 2
        // sqrt(sqrt(worley(20.0 * p + 2.0 * o))) // light 1

    ))));
}

void main() {

    vec2 uv = (gl_FragCoord.xy / resolution.xy);
    float t = fworley(uv * resolution.xy / 5500.0, offset[0]);
    //t *= exp(-length2(abs(0.0*uv - 1.0)));
    gl_FragColor = vec4(0.5 * t * vec3(0.1, 1.5*t, 1.2*t), 1.0);
}