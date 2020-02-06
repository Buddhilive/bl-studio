// Instantiate the model by loading the desired checkpoint.
const tonebreaker = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/trio_4bar');
//const tonebreaker = new mm.MusicVAE('../../checkpoints/trio_4bar');
const audioPlayer = new mm.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/sgm_plus');

Promise.all([tonebreaker.initialize()]).then(() => {
    console.log('Loaded!');
    appStatus.innerHTML = 'Ready!';
    statusText.style.display = 'none';
    appContainer.style.display = 'block';
    document.querySelector('.bl-loading--img').style.display = 'none';
});

const btnGenerate = document.querySelector('#btnGenerate');
const btnPlay = document.querySelector('#btnPlay');
const btnSave = document.querySelector('#btnSave');
const statusText = document.querySelector('.status-text');
const appContainer = document.querySelector('.bl-controllers--wrapper');
const appStatus = document.querySelector('.step-status-text');

let genSeq = [];
let generatedMusic;

btnGenerate.onclick = generateSample;
btnPlay.onclick = playSequence;
btnSave.onclick = saveSequence;

function generateSample() {
    appStatus.innerHTML = 'Music Generating...';
    btnPlay.disabled = true;
    btnSave.disabled = true;
    genSeq = [];
    tonebreaker.sample(10).then((samples) => {
        for (singleSample of samples) {
            genSeq.push(singleSample);
        }
        //genSeq.push(samples[0]);
        //console.log(samples);
    }).then(() => {
        mergeSequences();
        console.log('done');
        appStatus.innerHTML = 'Music Generated!';
        btnPlay.disabled = false;
        btnSave.disabled = false;
    });
}

async function mergeSequences() {
    try {
        const tempseq = mm.sequences.clone(genSeq[0]);
        let numSteps = genSeq[0].totalQuantizedSteps;
        for (let i = 1; i < genSeq.length; i++) {
            const seqZ = mm.sequences.clone(genSeq[i]);
            seqZ.notes.forEach((note, index) => {
                if (note.pitch > 10) {
                    note.quantizedStartStep += numSteps;
                    note.quantizedEndStep += numSteps;
                    tempseq.notes.push(note);
                } else {
                    console.log(note.pitch + " ignored!");
                }

            });
            numSteps += seqZ.totalQuantizedSteps;
        }
        tempseq.totalQuantizedSteps = numSteps;

        generatedMusic = tempseq;

    } catch (error) {
        appStatus.innerHTML = 'Error: ' + error;
    }

}

function playSequence() {
    appStatus.innerHTML = 'Player Initializing...';
    appStatus.classList.add('processing');
    if (audioPlayer.isPlaying()) {
        audioPlayer.stop();
        btnPlay.innerHTML = '<i class="material-icons">play_arrow</i> Replay';
        appStatus.innerHTML = 'Player Stoped';
    } else {
        audioPlayer.loadSamples(generatedMusic).then(() => {
            btnPlay.innerHTML = '<i class="material-icons">stop</i> Stop';
            appStatus.innerHTML = 'Playing...';
            audioPlayer.start(generatedMusic).then(() => {
                appStatus.innerHTML = 'Played!';
                btnPlay.innerHTML = '<i class="material-icons">play_arrow</i> Replay';
            });
        });
    }
}

function saveSequence() {
    try {
        const midiB = mm.sequenceProtoToMidi(generatedMusic);
        const fileB = new Blob([midiB], { type: 'audio/midi' });

        const a = document.createElement('a');
        const urlForFile = URL.createObjectURL(fileB);
        a.href = urlForFile;
        //a.innerHTML = "Download";
        a.download = 'buddhilive_' + Date.now() + '.mid';
        a.click();
        appStatus.innerHTML = 'Downloaded!'
    } catch (error) {
        appStatus.innerHTML = 'Error' + error;
    }
}