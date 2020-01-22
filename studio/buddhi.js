//Magenta models initializing
/* const musicEngine = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/multitrack_chords');
const modelEngine = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small'); */

const musicEngine = new mm.MusicVAE('checkpoints/multitrack_chords');
const modelEngine = new mm.MusicVAE('checkpoints/mel_2bar_small');

//Initializing Elements Variables
const chordProgSelector = document.querySelectorAll('.chords');
const statusSpinner = document.querySelector('#bl-spinner');
const statusText = document.querySelector('.status-text');
const btnShuffle = document.querySelector('#btnShuffle');
const btnGenerate = document.querySelector('#btnGenerate');
const btnPlay = document.querySelector('#btnPlay');
const btnSave = document.querySelector('#btnSave');
const btnMerge = document.querySelector('#btnMerge');
const btnProceed = document.querySelector('#btnProceed');
const btnNew = document.querySelector('#btnNew');
const stepSections = document.querySelectorAll('.bl-studio--controllers');

//Global Variables
let encodedMusic;
let genSeq = [];
let generatedMusic;
let playSample;
let randomNum = 1;
let theChords = [];
const audioPlayer = initPlayerAndEffects();
const melodySamplesArray = [Melody1, Melody2, Melody3, Melody4, Melody5];
let melodySample = Melody1;

const chordProgressions = ['F', 'Dm', 'Bb', 'C'];

//assign onclick functions to butons
btnProceed.onclick = getChordProgression;
btnShuffle.onclick = generateSample;
btnGenerate.onclick = generateMultiChords;
btnMerge.onclick = mergeSequences;
btnPlay.onclick = playSequence;
btnSave.onclick = saveSequence;
btnNew.onclick = reinitializeTool;

Promise.all([musicEngine.initialize(), modelEngine.initialize()]).then(() => {
    console.log('Loaded!');
    statusSpinner.style.visibility = "hidden";
    statusText.innerHTML = "Ready!";
    statusText.classList.remove('processing');
    btnProceed.disabled = false;
    chordProgSelector.forEach((elmnt) => {
        elmnt.disabled = false;
    });
});

/* 
Here goes the main functions
 */

//Load chord default progressions at initialization
function setChordProgression() {
    chordProgSelector.forEach((elmnt, indx) => {
        elmnt.value = chordProgressions[indx];
        elmnt.disabled = true;
    });
}

//Get chord progressions
function getChordProgression() {
    theChords = [];
    chordProgSelector.forEach((elmnt, indx) => {
        try {
            mm.chords.ChordSymbols.pitches(elmnt.value);
            theChords.push(elmnt.value);
        } catch (error) {
            document.querySelector('.step-status-text1').innerHTML = 'Invalid Chord: "' + elmnt.value + '"';
        }
    });

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 4; j++) {
            theChords.push(theChords[j]);
        }
    }

    if (theChords.length == 40) {
        document.querySelector('.step-status-text1').innerHTML = 'Chord Progressions Set!'
        stepSections[1].classList.remove('disable-step');
        stepSections[1].scrollIntoView();
        btnShuffle.disabled = false;
        stepSections[0].classList.add('disable-step');
        btnProceed.disabled = true;
    }
}

//Generate sample
function generateSample() {
    randomNum = Math.floor((Math.random() * 5));
    melodySample = melodySamplesArray[randomNum];
    try {
        modelEngine.encode([melodySample]).then(sample => {
            console.log("Encoding", sample);
            encodedMusic = sample;
        }).then(() => {
            document.querySelector('.step-status-text2').innerHTML = 'Sample Generated!'
            stepSections[2].classList.remove('disable-step');
            stepSections[2].scrollIntoView();
            btnGenerate.disabled = false;
            stepSections[1].classList.add('disable-step');
            btnShuffle.disabled = true;
        });
    } catch (error) {
        document.querySelector('.step-status-text2').innerHTML = 'Oops something went wrong. Error: ' + error;
    }

}

/* 
This is the main function that generates melody
 */
async function generateMultiChords() {
    genSeq = [];
    try {
        await theChords.map((chords, index) => {
            console.log(chords + " at " + index);
            musicEngine.decode(encodedMusic, 1, [chords], 24).then(sample => {
                console.log("Done", sample);
                genSeq.push(sample[0]);
            });
        });

        document.querySelector('.step-status-text3').innerHTML = 'Music Sequences Generated!'
        stepSections[3].classList.remove('disable-step');
        stepSections[3].scrollIntoView();
        btnMerge.disabled = false;
        stepSections[2].classList.add('disable-step');
        btnGenerate.disabled = true;
    } catch (error) {
        document.querySelector('.step-status-text3').innerHTML = 'Oops something went wrong. Error: ' + error;
    }

}

//concatenate Generated Samples
async function mergeSequences() {
    try {
        const tempseq = mm.sequences.clone(genSeq[0]);
        let numSteps = genSeq[0].totalQuantizedSteps;
        for (let i = 1; i < genSeq.length; i++) {
            const seqZ = mm.sequences.clone(genSeq[i]);
            seqZ.notes.forEach((note, index) => {
                if (note.pitch != 0) {
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

        playSample = tempseq;

        document.querySelector('.step-status-text4').innerHTML = 'Sequences Merged Successfully!'
        stepSections[4].classList.remove('disable-step');
        stepSections[4].scrollIntoView();
        btnPlay.disabled = false;
        stepSections[3].classList.add('disable-step');
        btnMerge.disabled = true;

    } catch (error) {
        document.querySelector('.step-status-text4').innerHTML = 'Oops something went wrong. Error: ' + error;
    }

}

//Refining Sequences
function refineSequences(sequenz) {
    const instrumentSeq = mm.sequences.mergeInstruments(sequenz);
    const unquantizedSeq = mm.sequences.unquantizeSequence(instrumentSeq);
    unquantizedSeq.ticksPerQuarter = 24;
    return unquantizedSeq;
}

//Play Generated Melody
function playSequence() {
    document.querySelector('.step-status-text5').innerHTML = 'Playing!'
    audioPlayer.start(playSample).then(() => {
        document.querySelector('.step-status-text5').innerHTML = 'Played!'
        stepSections[5].classList.remove('disable-step');
        stepSections[5].scrollIntoView();
        btnSave.disabled = false;
        btnNew.disabled = false;
    });
}

//Save Generated Melody as MIDI
function saveSequence() {
    try {
        const midiB = mm.sequenceProtoToMidi(playSample);
        const fileB = new Blob([midiB], { type: 'audio/midi' });

        const a = document.createElement('a');
        const urlForFile = URL.createObjectURL(fileB);
        a.href = urlForFile;
        //a.innerHTML = "Download";
        a.download = 'buddhilive_' + Date.now() + '.mid';
        a.click();
        document.querySelector('.step-status-text6').innerHTML = "Downloaded!";
    } catch (error) {
        document.querySelector('.step-status-text6').innerHTML = "Oops! Something went wrong! Try generating again. Error: " + error;
        btnSave.disabled = true;
    }
}

//Reinitialize
function reinitializeTool() {
    for (let i = 1; i <= 6; i++) {
        document.querySelector('.step-status-text' + i).innerHTML = "";
    }
    stepSections.forEach((elmnt, index) => {
        if (index == 4 || index == 5) {
            elmnt.classList.add('disable-step');
        }
    });
    btnProceed.disabled = false;
    btnPlay.disabled = true;
    btnSave.disabled = true;
    btnNew.disabled = true;

    stepSections[0].scrollIntoView();
}

/* 
These functions are taken from Magenta Example
 */

//Initializing SoundFont Player
function initPlayerAndEffects() {
    const MAX_PAN = 0.2;
    const MIN_DRUM = 35;
    const MAX_DRUM = 81;

    // Set up effects chain.
    const globalCompressor = new mm.Player.tone.MultibandCompressor();
    const globalReverb = new mm.Player.tone.Freeverb(0.25);
    const globalLimiter = new mm.Player.tone.Limiter();
    globalCompressor.connect(globalReverb);
    globalReverb.connect(globalLimiter);
    globalLimiter.connect(mm.Player.tone.Master);

    // Set up per-program effects.
    const programMap = new Map();
    for (let i = 0; i < 128; i++) {
        const programCompressor = new mm.Player.tone.Compressor();
        const pan = 2 * MAX_PAN * Math.random() - MAX_PAN;
        const programPanner = new mm.Player.tone.Panner(pan);
        programMap.set(i, programCompressor);
        programCompressor.connect(programPanner);
        programPanner.connect(globalCompressor);
    }

    // Set up per-drum effects.
    const drumMap = new Map();
    for (let i = MIN_DRUM; i <= MAX_DRUM; i++) {
        const drumCompressor = new mm.Player.tone.Compressor();
        const pan = 2 * MAX_PAN * Math.random() - MAX_PAN;
        const drumPanner = new mm.Player.tone.Panner(pan);
        drumMap.set(i, drumCompressor);
        drumCompressor.connect(drumPanner);
        drumPanner.connect(globalCompressor);
    }

    // Set up SoundFont player.
    const player = new mm.SoundFontPlayer(
        'https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/sgm_plus',
        globalCompressor, programMap, drumMap);
    return player;
}

window.onload = () => {
    setChordProgression();
}