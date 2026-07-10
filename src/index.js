import { html, render } from 'lit';
import '@ircam/sc-components';

import resumeAudioContext from '../lib/resume-audio-context.js';
import loadAudioBuffer from '../lib/load-audio-buffer.js';

const audioContext = new AudioContext();
await resumeAudioContext(audioContext);

const buffer = await loadAudioBuffer('./assets/sample.wav', audioContext.sampleRate);

render(html`
  <h1>random-scheduler</h1>
  <sc-bang
    @input=${e => {
      const src = audioContext.createBufferSource();
      src.connect(audioContext.destination);
      src.buffer = buffer;
      src.start();
    }}
  ></sc-bang>
`, document.body);

