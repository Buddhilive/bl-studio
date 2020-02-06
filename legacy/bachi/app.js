const modelEngine = new mm.Coconet('../../checkpoints/coconet');
const sampleEngine = new mm.MusicVAE('../../checkpoints/mel_2bar_small');
const audioPlayer = new mm.Player();

//Assigning elements to variables
const statusText = document.querySelector('.status-text');
const appContainer = document.querySelector('.bl-controllers--wrapper');
const appStatus = document.querySelector('.step-status-text');
const btnPlay = document.querySelector('#btnPlay');
const btnGenerate = document.querySelector('#btnGenerate');

let seq = [];
let sampleSeq;
let bachSample;

//Assign Events
btnGenerate.onclick = generateMusic;

Promise.all([modelEngine.initialize(), sampleEngine.initialize()]).then(() => {
    console.log('Loaded!');
    statusText.style.display = 'none';
    appContainer.style.display = 'block';
    document.querySelector('.bl-loading--img').style.display = 'none';
});

async function generateMusic() {
    appStatus.innerHTML = "Music Generating Started!";

    sampleEngine.sample(1, 0.5, undefined, 64, 80).then((genSamples) => {
        appStatus.innerHTML = "Bach is Involving...";
        sampleSeq = mm.sequences.quantizeNoteSequence(genSamples[0], 1);
        /*var bach = await model.infill(star, {
                        temperature: 1,
                        infillMask: {
                            step: 4,
                            voice: 0
                        },
                        numIterations: 200                    
                    });*/
        try {
            modelEngine.infill(genSamples[0]).then((sampleBach) => {
                bachSample = sampleBach;
                appStatus.innerHTML = "Done!";
                audioPlayer.start(bachSample);
            });
            //bachSample = modelEngine.infill(mm.sequences.quantizeNoteSequence(genSamples[0], 4));
            //seq = mm.sequences.mergeConsecutiveNotes(bachSample);
        } catch (err) {
            appStatus.innerHTML = "Oops! Something went wrong. Please refresh the page and try again."
        }
    });


    document.getElementById("btnPlay").disabled = false;
    document.getElementById('btnSave').disabled = false;

}