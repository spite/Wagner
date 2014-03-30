
( function() {

    function _h( f, c ) {
        return function() {
            var res = f.apply( this, arguments );
            c.apply( this, arguments );
            return res;
        }
    }

    function processErrors( errors, source ) {

        var css = '#shaderReport{ box-sizing: border-box; position: absolute; left: 0; top: 0; \
            right: 0; font-family: monaco, monospace; font-size: 12px; z-index: 10000; \
            background-color: #b70000; color: #ffffff; white-space: normal; \
            text-shadow: 0 -1px 0 rgba(0,0,0,.6); line-height: 1.2em; list-style-type: none; \
            padding: 0; margin: 0; max-height: 300px; overflow: auto; } \
            #shaderReport li{ padding: 10px; border-top: 1px solid rgba( 255, 255, 255, .2 ); \
            border-bottom: 1px solid rgba( 0, 0, 0, .2 ) } \
            #shaderReport li p{ padding: 0; margin: 0 } \
            #shaderReport li:nth-child(odd){ background-color: #c9542b }\
            #shaderReport li p:first-child{ color: #eee }';

        var el = document.createElement( 'style' );
        document.getElementsByTagName( 'head' )[ 0 ].appendChild( el );
        el.textContent = css;

        var report = document.createElement( 'ul' );
        report.setAttribute( 'id', 'shaderReport' );
        document.body.appendChild( report );

        var re = /ERROR: [\d]+:([\d]+): (.+)/gmi; 
        var lines = source.split( '\n' );

        var m;
        while ((m = re.exec( errors )) != null) {
            if (m.index === re.lastIndex) {
                re.lastIndex++;
            }
            var li = document.createElement( 'li' );
            var code = '<p>ERROR "<b>' + m[ 2 ] + '</b>" in line ' + m[ 1 ] + '</p>'
            code += '<p>' + lines[ m[ 1 ] - 1 ].replace( /^[ \t]+/g, '' ) + '</p>';
            li.innerHTML = code;
            report.appendChild( li );
        }
        
    }

    WebGLRenderingContext.prototype.compileShader = _h( 
        WebGLRenderingContext.prototype.compileShader, 
        function( shader ) {

            if ( !this.getShaderParameter( shader, this.COMPILE_STATUS ) ) {

                var errors = this.getShaderInfoLog( shader );
                var source = this.getShaderSource( shader );

                processErrors( errors, source );

            }
        } 
    );

} )();