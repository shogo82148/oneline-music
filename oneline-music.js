function parse(s) {
    return expression(s);

    function skipspace() {
        var spaces = s.match(/^\s+/);
        if(spaces) s = s.substring(spaces.toString().length);
    }

    function number() {
        var ch;
        var m, exp;
        skipspace();

        // 関数は定義済み関数のみ扱う
        m = s.match(/^(sin|cos|tan|sqrt)\(/);
        if(m) {
            s = s.substring(m[0].length);
            exp = expression();
            skipspace();
            if(s.charAt(0)!=')') throw 'missing )';
            s = s.substring(1);
            return [m[1], exp];
        }

        // カッコ
        m = s.match(/^\(/);
        if(m) {
            s = s.substring(1);
            exp = expression();
            skipspace();
            if(s.charAt(0)!=')') throw 'missing )';
            s = s.substring(1);
            return exp;
        }

        // 変数
        m = s.match(/^[a-z][0-9a-z]*/i);
        if(m) {
            s = s.substring(m[0].length);
            return ['variable', m[0]];
        }

        // 整数
        m = s.match(/^(0x[0-9a-f]+|0[0-7]*|[1-9][0-9]*)/i);
        if(m) {
            s = s.substring(m[0].length);
            return ['number', parseInt(m[0])];
        }
        return null;
    }

    function factor() {
        skipspace();
        var ch = s.charAt(0);
        if(ch=='+') {
            s = s.substring(1);
            return factor();
        } else if(ch=='-') {
            s = s.substring(1);
            return ['minus', factor()];
        } else if(ch=='!') {
            s = s.substring(1);
            return ['!', factor()];
        }
        return number();
    }

    function term() {
        var a = factor();
        skipspace();
        var ch;
        while(s) {
            ch = s.charAt(0);
            if(ch=='*') {
                s = s.substring(1);
                a = ['*', a, factor()];
            } else if(ch=='/') {
                s = s.substring(1);
                a = ['/', a, factor()];
            } else if(ch=='%') {
                s = s.substring(1);
                a = ['%', a, factor()];
            } else break;
            skipspace();
        }
        return a;
    }

    function additive() {
        var a = term();
        skipspace();
        var ch;
        while(s) {
            ch = s.charAt(0);
            if(ch=='+') {
                s = s.substring(1);
                a = ['+', a, term()];
            } else if(ch=='-') {
                s = s.substring(1);
                a = ['-', a, term()];
            } else break;
            skipspace();
        }
        return a;
    }

    function shift() {
        var a = additive();
        skipspace();
        while(s) {
            if(s.match(/^>>/)) {
                s = s.substring(2);
                a = ['>>', a, additive()];
            } else if(s.match(/^<</)) {
                s = s.substring(2);
                a = ['<<', a, additive()];
            } else break;
            skipspace();
        }
        return a;
    }

    function compare() {
        var a = shift();
        skipspace();
        while(s) {
            if(s.match(/^<=/)) {
                s = s.substring(2);
                a = ['<=', a, shift()];
            } else if(s.match(/^<[^<]/)) {
                s = s.substring(1);
                a = ['<', a, shift()];
            } else if(s.match(/^>=/)) {
                s = s.substring(2);
                a = ['>=', a, shift()];
            } else if(s.match(/^>[^>]/)) {
                s = s.substring(1);
                a = ['>', a, shift()];
            } else break;
            skipspace();
        }
        return a;
    }

    function equals() {
        var a = compare();
        skipspace();
        while(s) {
            if(s.match(/^==/)) {
                s = s.substring(2);
                a = ['==', a, compare()];
            } else if(s.match(/^!=/)) {
                s = s.substring(2);
                a = ['!=', a, compare()];
            } else break;
            skipspace();
        }
        return a;
    }

    function bitand() {
        var a = equals();
        skipspace();
        var ch;
        while(s) {
            ch = s.charAt(0);
            if(ch=='&') {
                s = s.substring(1);
                a = ['&', a, equals()];
            } else break;
            skipspace();
        }
        return a;
    }

    function bitxor() {
        var a = bitand();
        skipspace();
        var ch;
        while(s) {
            ch = s.charAt(0);
            if(ch=='^') {
                s = s.substring(1);
                a = ['^', a, bitand()];
            } else break;
            skipspace();
        }
        return a;
    }

    function bitor() {
        var a = bitxor();
        skipspace();
        var ch;
        while(s) {
            ch = s.charAt(0);
            if(ch=='|') {
                s = s.substring(1);
                a = ['|', a, bitxor()];
            } else break;
            skipspace();
        }
        return a;
    }

    function logicaland() {
        var a = bitor();
        skipspace();
        while(s) {
            if(s.match(/^&&/)) {
                s = s.substring(2);
                a = ['&&', a, bitor()];
            } else break;
            skipspace();
        }
        return a;
    }

    function logicalor() {
        var a = logicaland();
        skipspace();
        while(s) {
            if(s.match(/^\|\|/)) {
                s = s.substring(2);
                a = ['||', a, logicaland()];
            } else break;
            skipspace();
        }
        return a;
    }

    function expression() {
        var a = logicaland();
        var trueexp, falseexp;
        skipspace();
        if(s.charAt(0)=='?') {
            s = s.substring(1);
            trueexp = expression();
            skipspace();
            if(s.charAt(0) != ':') throw '?:';
            s = s.substring(1);
            falseexp = expression();
            return ['?', a, trueexp, falseexp];
        }
        return a;
    }

}

function calc(a, env) {
    return (function calc(a) {
        switch(a[0]) {
        case 'number':
            return a[1];
        case 'variable':
            return env[a[1]];
        case 'sin':
            return Math.sin(calc(a[1]));
        case 'cos':
            return Math.cos(calc(a[1]));
        case 'tan':
            return Math.tan(calc(a[1]));
        case 'sqrt':
            return Math.sqrt(calc(a[1]));
        case 'minus':
            return -calc(a[1]);
        case '!':
            return calc(a[1])==0 ? 1 : 0;
        case '*':
            return calc(a[1]) * calc(a[2]);
        case '/':
            return calc(a[1]) / calc(a[2]);
        case '%':
            return calc(a[1]) % calc(a[2]);
        case '+':
            return calc(a[1]) + calc(a[2]);
        case '-':
            return calc(a[1]) - calc(a[2]);
        case '>>':
            return calc(a[1]) >> calc(a[2]);
        case '<<':
            return calc(a[1]) << calc(a[2]);
        case '<=':
            return calc(a[1]) <= calc(a[2]) ? 1 : 0;
        case '<':
            return calc(a[1]) < calc(a[2]) ? 1 : 0;
        case '>=':
            return calc(a[1]) >= calc(a[2]) ? 1 : 0;
        case '>':
            return calc(a[1]) > calc(a[2]) ? 1 : 0;
        case '==':
            return calc(a[1]) == calc(a[2]) ? 1 : 0;
        case '!=':
            return calc(a[1]) != calc(a[2]) ? 1 : 0;
        case '&':
            return calc(a[1]) & calc(a[2]);
        case '^':
            return calc(a[1]) ^ calc(a[2]);
        case '|':
            return calc(a[1]) | calc(a[2]);
        case '&&':
            return calc(a[1]) && calc(a[2]) ? 1 : 0;
        case '||':
            return calc(a[1]) || calc(a[2]) ? 1 : 0;
        case '?':
            return calc(calc(a[1])!=0 ? a[2] : a[3]);
        }
        return 0;
    })(a);
}

window.addEventListener('load', function() {
    var context = new webkitAudioContext();
    var samplerate = context.sampleRate, channel = 1, stream_length = 8192;
    var analyser = context.createAnalyser();
    var lowpass = context.createBiquadFilter();
    var node;
    var canvas = document.getElementById('canvas');
    var context2d = canvas.getContext('2d');
    var width = canvas.width, height = canvas.height;
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
    var timeDomainData = new Uint8Array(analyser.frequencyBinCount);

    function animationLoop() {
        var value;
        if(document.getElementById('timeDomain').checked) {
            analyser.getByteTimeDomainData(timeDomainData);
        } else {
            analyser.getByteFrequencyData(timeDomainData);
        }
        context2d.clearRect(0, 0, width, height);
        context2d.strokeStyle = 'lightgreen';
        context2d.beginPath();
        context2d.moveTo(-9999,9909);
        for (var i = 0; i < timeDomainData.length; ++i){
            value = height - timeDomainData[i];
            context2d.lineTo(i/timeDomainData.length*width,value);
        }
        context2d.moveTo(9999,-9999);
        context2d.stroke();
        requestAnimationFrame(animationLoop);
    }

    function play() {
        var t = 0, exp;
        try {
            exp = parse(document.getElementById('expression').value);
        } catch(e) {
            stop();
        }
        node = context.createJavaScriptNode(stream_length, 1, channel);
        node.onaudioprocess = function(event) {
            var data = event.outputBuffer.getChannelData(0);
            var cache = {};
            var i, length = data.length;
            var tt;
            for(i = 0; i < length; ++i, ++t) {
                tt = t/samplerate*8000|0;
                if(cache[tt]) {
                    data[i] = cache[tt];
                } else {
                    try {
                        data[i] = cache[tt] = ((calc(exp, {t: tt}) & 255) - 127.5) / 127.5;
                    } catch(e) {
                        stop();
                    }
                }
            }
        };

        lowpass.type = 0;
        lowpass.frequency.value = 4000;

        node.connect(lowpass);
        lowpass.connect(analyser);
        analyser.connect(context.destination);
        animationLoop();
        document.getElementById('play').value = 'stop';
    }

    function stop() {
        if(node) node.disconnect();
        node = null;
        document.getElementById('play').value = 'play';
    }

    document.getElementById('play').addEventListener('click', function() {
        if(node) {
            stop();
        } else {
            play();
        }
    });

    function hashchange() {
        var hash;
        if(location.hash) {
            hash = location.hash.substring(1);
            document.getElementById('expression').value = hash;
        }
    }

    window.addEventListener('hashchange', hashchange, false);
    hashchange();

});
