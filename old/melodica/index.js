/*
නමෝ බුද්ධාය!
*/

//Loading Checkpoints
var music_machine = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn');
var music_gen = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_chords');
//var music_machine = new mm.MusicRNN('../checkpoints/melody_rnn');
//var music_gen = new mm.MusicVAE('../checkpoints/mel_chords');

Promise.all([music_machine.initialize(), music_gen.initialize()]).then(function() {
    setTimeout(function(){ 
        document.getElementById("theOverlay").style.display = "none";
        document.getElementById("theModal").style.display = "none";
    }, 3000);
});

//Initializing UI Components
var seqWidth = window.innerWidth - 400;
var seqHeight = window.innerHeight - 180;

var config = {
    noteHeight: 6,
    pixelsPerTimeStep: 3,
    noteSpacing: 1,
    noteRGB: '73, 109, 145',
    activeNoteRGB: '255, 111, 0',
}

var grandSequencer = new mm.PianoRollCanvasVisualizer(Melody1, document.getElementById('grandMatrix'), config);

var melodyPlayer = new mm.Player(false, {
    run: (note) => grandSequencer.redraw(note),
    stop: () => {playSequence();}
});

var dialerVar = new Nexus.Dial('#dialerVar' ,{
    'size': [50,50],
    'interaction': 'radial',
    'mode': 'relative', 
    'min': 0.5,
    'max': 2,
    'step': 0.1,
    'value': 1
});
dialerVar.colorize("accent","#FF6F00");
var numberVar= new Nexus.Number('#numberVar');
numberVar.link(dialerVar);

var dialerTemp = new Nexus.Dial('#dialerTemp' ,{
    'size': [50,50],
    'interaction': 'radial', 
    'mode': 'relative', 
    'min': 100,
    'max': 400,
    'step': 20,
    'value': 200
});
dialerTemp.colorize("accent","#FFA800");
var numberTemp = new Nexus.Number('#numberTemp');
numberTemp.link(dialerTemp);

var scaleSelect = new Nexus.Select('#scaleSelect',{
    'size': [80,30],
    'options': ['C','D','E','F','G','A','B','Cm','Dm','Em','Fm','Gm','Am','Bm']
});

var barSelect = new Nexus.Select('#barSelect',{
    'size': [80,30],
    'options': ['4','8']
});

//button functions declaration
document.getElementById("btnPlay").onclick = function() {playSequence()};
document.getElementById("btnStop").onclick = function() {stopSequence()};
document.getElementById("btnPause").onclick = function() {pauseSequence()};
document.getElementById("btnSet").onclick = function() {openSettings()};
document.getElementById("btnGenerate").onclick = function() {generateMusic()};
document.getElementById("btnSettings").onclick = function() {updateSetup()};
var btnSave = document.getElementById("btnSave");
btnSave.onclick = function() {saveMIDI()};
//var melodyMenu = document.getElementById("melodyMenu");
var notification = document.querySelector('.mdl-js-snackbar');

//initializing variables
var melodySeq;
var playTempo = numberTemp.value;
var rnn_temperature = numberVar.value;
var sampleMelody = Melody1;
var midiUrl = "";
var sampleMelody2 = Melody1;
var chordProg = "C";
var numBars = "32"

//melodyMenu.innerHTML = "Melody1";


//Program
function playSequence() {
    //grandSequencer.start(playTempo);
    if (melodyPlayer.getPlayState() == 'stopped') {
        melodyPlayer.start(melodySeq, playTempo);
    } else if (melodyPlayer.getPlayState() == 'paused') {
        melodyPlayer.resume();
    }

    document.getElementById("btnStop").disabled = false;
    document.getElementById("btnPause").disabled = false;
    document.getElementById("btnPlay").disabled = true;
}

function pauseSequence() {
    //grandSequencer.start(playTempo);
    melodyPlayer.pause();
    document.getElementById("btnStop").disabled = false;
    document.getElementById("btnPause").disabled = true;
    document.getElementById("btnPlay").disabled = false;
}

function stopSequence() {
    //grandSequencer.stop();
    melodyPlayer.stop();
    document.getElementById("btnPlay").disabled = false;
    document.getElementById("btnPause").disabled = true;
    document.getElementById("btnStop").disabled = true;
}

function openSettings() {
    document.querySelector('.mdl-layout__obfuscator').classList.add("is-visible");
    document.querySelector('.mdl-layout__drawer').classList.add("is-visible");
    document.getElementById("theDrawer").setAttribute('aria-hidden', false);
}

async function generateMusic() {
    btnSave.disabled = true;
    //console.log(numBars+" "+chordProg);

    //notification_main.start();

    if (music_machine.isInitialized() == true) {

        //melodySeq = await music_gen.continueSequence(sampleMelody, 64, rnn_temperature, ['A']);

        var melodySeq1 = await music_gen.interpolate([sampleMelody, sampleMelody2], 1, rnn_temperature, [chordProg]);
        melodySeq = await music_machine.continueSequence(mm.sequences.quantizeNoteSequence(melodySeq1[0], 4), numBars, rnn_temperature);

        grandSequencer = new mm.PianoRollCanvasVisualizer(melodySeq, document.getElementById('grandMatrix'), config);

        notification.MaterialSnackbar.showSnackbar(
            {
                message: 'Music Generated!',
                timeout: 2000
            }
        );

        //notification_end.start();

        document.getElementById("btnPlay").disabled = false;
        btnSave.disabled = false;
    }
}

function updateSetup() {
    playTempo = numberTemp.value;
    rnn_temperature = numberVar.value;
    //melodyUpdate();

    document.querySelector('.mdl-layout__obfuscator').classList.remove("is-visible");
    document.querySelector('.mdl-layout__drawer').classList.remove("is-visible");
    document.getElementById("theDrawer").setAttribute('aria-hidden', true);

    notification.MaterialSnackbar.showSnackbar(
        {
            message: 'Settings Saved!',
            timeout: 2000
        }
    );

};

function saveMIDI () {
    const sampleSeq = mm.sequences.unquantizeSequence(melodySeq, playTempo);
    //const sampleSeq = mm.sequences.quantizeNoteSequence(melodySeq, 4);
    const midiB = mm.sequenceProtoToMidi(sampleSeq);
    const fileB = new Blob([midiB], {type: 'audio/midi'});
    saveAs(fileB, 'melody_by_buddhilive' + Date.now() + '.mid');
};

async function setMelody() {
    var sampleMelodyA = await mm.urlToNoteSequence(midiUrl);
    var sampleMelodyB = mm.sequences.quantizeNoteSequence(sampleMelodyA, 4);
    sampleMelody = mm.sequences.trim(sampleMelodyB, 0, 32, true);
    sampleMelody2 = mm.sequences.trim(sampleMelodyB, 32, 64, true);
    document.getElementById("btnGenerate").disabled = false;
    //console.log('melody updated');
};

function previewFile() {
    var file    = document.querySelector('input[type=file]').files[0];
    var reader  = new FileReader();
    //console.log(file.name +  " is " + file.size/1024 + "kb");
    document.getElementById('loadedFile').innerHTML = file.name;

    reader.addEventListener("load", function () {
        //var playFile = new mm.midiToSequenceProto(reader.result);
        //new mm.Player().start(playFile);
        midiUrl = reader.result;
        setMelody();
    }, false);

    if (file) {
        //reader.readAsBinaryString(file);
        reader.readAsDataURL(file);
    }

};

scaleSelect.on('change', function(v) {
    chordProg = v.value;
});

barSelect.on('change', function(v) {
    numBars = parseInt(v.value) * 16;
});

