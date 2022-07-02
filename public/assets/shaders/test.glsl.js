---
name: skin
type: fragment
author: Richard Davey
uniform.radius: { "type": "1f", "value": 0.07 }
uniform.cells: { "type": "2fv", "value": [] }
---

precision mediump float;

const int cellsLength = 50;
const float alpha = 0.8;

uniform float radius;
uniform vec2 cells[cellsLength];

uniform vec2 resolution;

varying vec2 fragCoord;

void main(void) {
    vec4 color = vec4(0.);
    vec2 st = fragCoord.xy / resolution.xy;


    for(int i = 0; i < cellsLength; i++) {
        vec2 cell = cells[i];
        if (cell.xy != vec2(-1.)) {
            float closestDist = 1.0;

            for(int j = 0; j < cellsLength; j++) {
                vec2 cell2 = cells[j];
                if (cell2.xy != vec2(-1.)) {
                    float dist2 = distance(st.xy, cell2.xy);

                    if (dist2 < closestDist) {
                        closestDist = dist2;
                    }
                }
            }


            if (closestDist < radius) {
                float brightness = 0.55 + min((radius - closestDist) / radius, 0.2);

                color = alpha * vec4(brightness * 1.0, brightness * 0.85, brightness * 0.75, 1.0);
            }
        }
        /* Do Some Calculation */
    }

    // for(int i = 0; i < cellsLength; i++) {
    //         vec2 cell = cells[i];
    //         if (cell.xy != vec2(-1.)) {
    //             float dist = distance(st.xy, cell.xy);
    //             //
    //             if (dist < radius) {
    //                 float brightness = 1.0 + (radius - dist) / radius;
    //
    //                 color = alpha * vec4(brightness * 0.6, brightness * 0.55, brightness * 0.55, 1.0);
    //             }
    //         }
    //         /* Do Some Calculation */
    //     }

    gl_FragColor = vec4(color);
}