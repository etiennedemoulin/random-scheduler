export class Engine {
  constructor(audioContext, state) {
    this.audioContext = audioContext;
    this.state = state;

    this.osc = this.audioContext.createOscillator();
    this.env = this.audioContext.createGain();
    this.osc.type = "sine";
    this.osc.connect(this.env);

    this.osc2 = this.audioContext.createOscillator();
    this.env2 = this.audioContext.createGain();
    this.osc2.type = "sine";
    this.osc2.connect(this.env2);

    this.env.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.osc.start();

    this.env2.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.osc2.start();

    this.triggerTime = 0;

  }

  start() {

    this.stop();
    const now = this.audioContext.currentTime;

    this.triggerTime = now + 0.05;
    const attackTime = this.triggerTime + this.state.attack;
    const statTime1 = attackTime + this.state.stationary1;
    const decayTime = statTime1 + this.state.decay / 2;
    const statTime2 = decayTime + this.state.stationary2;
    const sustainTime = statTime2 + this.state.decay / 2;
    const statTime3 = sustainTime + this.state.stationary3;
    const releaseTime = statTime3 + this.state.release;

    const volume = this.state.volume / 400;
    const decayVolume = this.state.sustain / 400;
    const volume2 = this.state.volume2 / 400;

    let sustainVolume;
    if (this.state.stationary3 === 0) {
      sustainVolume = decayVolume;
    } else {
      sustainVolume = volume;
    }

    // enveloppe volume
    this.env.gain.setValueAtTime(0, this.triggerTime);
    this.env.gain.linearRampToValueAtTime(volume, attackTime);
    this.env.gain.setValueAtTime(volume, statTime1);
    this.env.gain.linearRampToValueAtTime(decayVolume, decayTime);
    this.env.gain.setValueAtTime(decayVolume, statTime2);
    this.env.gain.linearRampToValueAtTime(sustainVolume, sustainTime);
    this.env.gain.setValueAtTime(sustainVolume, statTime3);
    this.env.gain.linearRampToValueAtTime(0, releaseTime);

    // enveloppe frequency
    this.osc.frequency.setValueAtTime(this.state.startFreq, this.triggerTime);
    this.osc.frequency.setValueAtTime(this.state.startFreq, attackTime);
    this.osc.frequency.linearRampToValueAtTime(this.state.endFreq, statTime3);

    // visuel enveloppe
    this.env2.gain.setValueAtTime(0, this.triggerTime);
    this.env2.gain.linearRampToValueAtTime(volume2, attackTime);
    this.env2.gain.setValueAtTime(volume2, statTime3);
    this.env2.gain.linearRampToValueAtTime(0, releaseTime);

    // visuel frequency
    this.osc2.frequency.setValueAtTime(this.state.freq2, this.triggerTime);

  }

  stop() {

    const now = this.audioContext.currentTime;
    
    this.env.gain.cancelScheduledValues(now);
    this.osc.frequency.cancelScheduledValues(now);

    this.env2.gain.cancelScheduledValues(now);
    this.osc2.frequency.cancelScheduledValues(now);

    this.env.gain.linearRampToValueAtTime(0, now + 0.05);
    this.env2.gain.linearRampToValueAtTime(0, now + 0.05);

  }

  getCurrentValues() {

    // multiply by 400 because trimmed in start function
    
    return [
      this.osc.frequency.value,
      this.osc2.frequency.value,
      this.env.gain.value * 400,
      this.env2.gain.value * 400
    ];
  }

  getAttack() {
    if (this.state) {
      return this.state.attack;
    } else {
      return 0
    }
  }

  getRelease() {
    if (this.state) {

    return this.state.release;
  } else {
    return 0
  }
  }

  getEventDuration() {
    if (this.state) {
      return this.state.attack + this.state.stationary1 + this.state.decay + this.state.stationary2 + this.state.stationary3 + this.state.release;
    } else {
      return 0
    }
  }

  getCurrentTime() {
    const eventDuration = this.getEventDuration();
    return eventDuration - (this.audioContext.currentTime - this.triggerTime);
  }

  connect(destination, input, output) {
    this.env.connect(destination, input, output);
    this.env2.connect(destination, input, output);
  }

  disconnect() {
    this.env.disconnect();
  }

  requestUpdate(update) {
    this.state = update;
  }

}