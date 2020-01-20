var seq="";
document.getElementById('outputArea').innerHTML = "Initializing....Please wait!";
// Instantiate the model by loading the desired checkpoint.
const model = new mm.Coconet('https://storage.googleapis.com/magentadata/js/checkpoints/coconet/bach');
//const model = new mm.Coconet('checkpoints/coconet');
const melodyPlayer = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
const modelRNN = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn');
//const modelRNN = new mm.MusicRNN('checkpoints/melody_rnn');

document.getElementById("btnPlay").onclick = function() {playSequence()};
document.getElementById("btnSave").onclick = function() {saveMIDI()};
document.getElementById("btnGenerate").onclick = function() {generateMusic()};

mm.Player.tone.context.resume();

Promise.all([model.initialize(), modelRNN.initialize()]).then(function() {
    setTimeout(function(){ 
        document.getElementById("btnPlay").style.visibility = "visible";
        document.getElementById("btnPlay").disabled = false;
        document.getElementById("btnSave").style.visibility = "visible";
        document.getElementById("btnGenerate").style.visibility = "visible";
        document.getElementById("spinner").style.visibility = "hidden";
        document.getElementById('outputArea').innerHTML = "Hooray! Models Loaded!";
    }, 3000);
});
//console.log("loaded");

var midiUrl ="";
var fileName = "";
async function generateMusic() {
    document.getElementById('outputArea').innerHTML = "Music Generating Started!";

    var x = Math.floor((Math.random() * 10) + 1);
    midiUrl = 'songs/song' + x + '.midi';

    document.getElementById('outputArea').innerHTML = "Composing Sample..." + x;

    const teapot = await mm.urlToNoteSequence(midiUrl);
    var config = {
        noteHeight: 6,
        pixelsPerTimeStep: 10,
        noteSpacing: 1,
        noteRGB: '73, 109, 145',
        activeNoteRGB: '255, 111, 0',
    }

    document.getElementById('outputArea').innerHTML = "Sample Checking...";

    const star1 = mm.sequences.quantizeNoteSequence(teapot, 4);
    const star = mm.sequences.trim(star1, 0, 64, true);
    const melodyRNN = await modelRNN.continueSequence(star1, 64, 1);

    document.getElementById('outputArea').innerHTML = "Bach is Involving...";

    /*var bach = await model.infill(star, {
                    temperature: 1,
                    infillMask: {
                        step: 4,
                        voice: 0
                    },
                    numIterations: 200                    
                });*/
    try {
    var bach = await model.infill(melodyRNN);
    seq = mm.sequences.mergeConsecutiveNotes(bach);
    } catch (err) {
        document.getElementById('outputArea').innerHTML = "Oops! Something went wrong. Please refresh the page and try again."
    }

    document.getElementById('outputArea').innerHTML = "Done!";

    melodyPlayer.start(seq);
    document.getElementById("btnPlay").disabled = false;
    document.getElementById('btnSave').disabled = false;

    //var viz = new mm.PianoRollCanvasVisualizer(star, document.getElementById('canvas'), config);
    /*new mm.Player(false, {
                    run: (note) => viz.redraw(note),
                    stop: () => {console.log('done');}
                }).start(star);*/
    //console.log(mm.sequences.getQuantizedTimeEvents(star));
    //document.getElementById('outputArea').innerHTML = JSON.stringify(star1);

}

function playSequence() {
    if (melodyPlayer.getPlayState() == 'stopped') {
        melodyPlayer.start(seq);
    } else if (melodyPlayer.getPlayState() == 'paused') {
        melodyPlayer.resume();
    }

    //document.getElementById("btnStop").disabled = false;
    //document.getElementById("btnPause").disabled = false;
    document.getElementById("btnPlay").disabled = false;
}

function pauseSequence() {
    //grandSequencer.start(playTempo);
    melodyPlayer.pause();
    //document.getElementById("btnStop").disabled = false;
    //document.getElementById("btnPause").disabled = true;
    document.getElementById("btnPlay").disabled = false;
}

function stopSequence() {
    //grandSequencer.stop();
    melodyPlayer.stop();
    document.getElementById("btnPlay").disabled = false;
    //document.getElementById("btnPause").disabled = true;
    //document.getElementById("btnStop").disabled = true;
}

function saveMIDI() {
    const midiB = mm.sequenceProtoToMidi(seq);
    const fileB = new Blob([midiB], {type: 'audio/midi'});
    saveAs(fileB, fileName + '_buddhilive_' + Date.now() + '.mid');
}
/*function previewFile() {

                var file    = document.querySelector('input[type=file]').files[0];
                var reader  = new FileReader();
                //console.log(file.name +  " is " + file.size/1024 + "kb");
                fileName = file.name

                reader.addEventListener("load", function () {
                    //var playFile = new mm.midiToSequenceProto(reader.result);
                    //new mm.Player().start(playFile);
                    midiUrl = reader.result;
                    //console.log(midiUrl);
                }, false);

                if (file) {
                    //reader.readAsBinaryString(file);
                    reader.readAsDataURL(file);
                }

            }*/