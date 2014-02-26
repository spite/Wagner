- ~~ShaderLoader will probably be removed, or be transparent to the user~~
- ~~Passing parameters to WAGNER.ShaderPass from main code
- ~~Correct use of textures of different dimensions along the chain~~
- ~~Multiple Composers working at the same time~~
- Shaders that are not ported to WAGNER.Pass: ~~pixelate~~, ~~rgb split~~, different single-pass bloom
- Shaders that haven't even been ported to WAGNER: ~~SSAO~~, ~~DOF~~, camera motion blur, directional blur, gamma, levels, ~~edge detection~~
- ~~Alias definition of passes (previously loadPass()) legacy~~ REMOVED
- uniform reflection from GLSL source doesn't support structures (I don't even know if WebGL supports structures)
- ~~something is wrong with alpha: some additive effects are different when using RGB/RGBA format~~
- add packed normal material
- add uv material / uv packed material (does it make sense?)
- add combined normal + height, uv + height materials (?)
- add finish effects like autoawesome

References
----------

https://github.com/mrdoob/three.js/blob/master/examples/js/postprocessing/EffectComposer.js
https://www.shadertoy.com/user/hornet
http://devmaster.net/posts/3100/shader-effects-glow-and-bloom#
https://github.com/v002/v002-FXAA/blob/master/v002.FXAA.frag
https://github.com/evanw/glfx.js/tree/master/src/filters
http://forum.libcinder.org/topic/glsl-beginner-photoshop-blending-modes
http://mouaif.wordpress.com/2009/01/05/photoshop-math-with-glsl-shaders/
http://mouaif.wordpress.com/2008/06/11/crossprocessing-shader/
http://developer.amd.com/wordpress/media/2012/10/03_Clever_Shader_Tricks.pdf
http://developer.amd.com/wordpress/media/2012/10/ATI_EGDC_AdvancedShaders.pdf
