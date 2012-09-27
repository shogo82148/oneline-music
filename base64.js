function base64(input) {
    var i, length = input.length;
    var x, y, z;
    var s = '';
    var table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for(i = 0; i < length; i += 3) {
        x = input[i];
        y = i + 1 < length ? input[i+1] : 0;
        z = i + 2 < length ? input[i+2] : 0;
        s += table.charAt(x >> 2) +
            table.charAt(((x&0x03) << 4) | (y >> 4)) +
            (i + 1 < length ? table.charAt(((y&0x0F) << 2) | (z >> 6)) : '=') +
            (i + 2 < length ? table.charAt(z & 0x3F) : '=');
    }
    return s;
}

function WaveFile(channel, bit, samplingRate, samples) {
    var byteSize = bit >> 3;
    var dataSize = samples * byteSize * channel;
    var buffer = new ArrayBuffer(dataSize + 44);
    var dv = new DataView(buffer);
    var offset = 0;

    dv.setUint32(offset, 0x52494646); offset += 4; // RIFF
    dv.setUint32(offset, dataSize + 36, true); offset += 4;
    dv.setUint32(offset, 0x57415645); offset += 4; // WAVE
    dv.setUint32(offset, 0x666d7420); offset += 4; // fmt
    dv.setUint32(offset, 16, true); offset += 4;
    dv.setUint16(offset, 1, true); offset += 2;
    dv.setUint16(offset, channel, true); offset += 2;
    dv.setUint32(offset, samplingRate, true); offset += 4;
    dv.setUint32(offset, samplingRate * channel * byteSize, true); offset += 4;
    dv.setUint16(offset, channel * byteSize, true); offset += 2;
    dv.setUint16(offset, bit, true); offset += 2;
    dv.setUint32(offset, 0x64617461); offset += 4;
    dv.setUint32(offset, dataSize, true); offset += 4;

    this.buffer = buffer;
    this.offset = offset;
}

WaveFile.prototype.toUint8Array = function() {
    return new Uint8Array(this.buffer);
};

WaveFile.prototype.getDataView = function() {
    return new DataView(this.buffer, this.offset);
};

window.addEventListener('load', function() {
    document.getElementById('play').addEventListener('click', function() {
        var ctx = canvas.getContext('2d');
        var w = new WaveFile(1, 8, 8000, 8000*10);
        var dv = w.getDataView();
        var t = 0;
        var audio = new Audio();
        var data = newData();
        audio.volume = 0.1;
        audio.src = data;
        audio.play();
        data = newData();
        audio.addEventListener('ended', function() {
            audio.src = data;
            audio.play();
            setInterval(function() {data = newData();}, 100);
        });
        function newData() {
            var offset, tt = 0, x;
            for(offset = 0; offset < 8000 * 10; ++t, ++offset) {
                x = Math.sin(tt) * 127 + 128;
                tt += 440/8000.0 * 3.141592653589793238 * 2;
                dv.setUint8(offset, x);
            }
            return 'data:audio/wav;base64,' + base64(w.toUint8Array());
        }
    });
});
