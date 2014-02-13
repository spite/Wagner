varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tBias;
uniform vec2 delta;
uniform float invertBiasMap;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

void main() {

	float f = texture2D( tBias, vUv ).r;
	if( invertBiasMap == 1. ) f = 1. - f;
	f = 2. *  abs( .5 - f );
	vec4 o = texture2D( tDiffuse,vUv );
	vec4 color=vec4(0.0);
	float total=0.0;
	vec2 tDelta = f * delta;
	float offset=random(vec3(12.9898,78.233,151.7182),0.0);
	for(float t=-30.0;t<=30.0;t++){
		float percent=(t+offset-0.5)/30.0;
		float weight=1.0-abs(percent);
		vec4 sample=texture2D(tDiffuse,vUv+tDelta*percent);
		sample.rgb*=sample.a;
		color+=sample*weight;
		total+=weight;
	}
	
	if( total == 0. ) total = 1.;
	gl_FragColor = mix( o, color/total, f );
	gl_FragColor.rgb/=gl_FragColor.a+0.00001;
	
}