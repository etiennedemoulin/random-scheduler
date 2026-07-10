import { LitElement, html, render } from 'lit';

import resumeAudioContext from '../lib/resume-audio-context.js';

import './MainDiv.js';

import { Scheduler } from '@ircam/sc-scheduling';

import { getTime } from '@ircam/sc-gettime';

const audioContext = new AudioContext();

const states = [];
const numChannels = audioContext.destination.maxChannelCount;

console.log('> Num Channels:', audioContext.destination.channelCount);

audioContext.destination.channelCount = numChannels;
audioContext.destination.channelCountMode = "explicit";
audioContext.destination.channelInterpretation = 'discrete';

await resumeAudioContext(audioContext);

const scheduler = new Scheduler(getTime);

render(html`
  <h1>random-scheduler</h1>
  <main-div .numChannels=${numChannels} .scheduler=${scheduler} .audioContext=${audioContext}></main-div>
`, document.body);

