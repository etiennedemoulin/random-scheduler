import { LitElement, html, css, nothing } from 'lit';

import '@ircam/sc-components';
import { getRandomNumber } from './utils.js'

class IndividualDiv extends LitElement {

	static properties = {
	  enveloppes: {
	    hasChanged() { return true }
	  },
	  transportState: {
	  	hasChanged() { return true }
	  },
	  id: {
	  	type: Number
	  },
	  currentEnveloppe: { state: true },
	  currentTime: { state : true },
	  interDuration: { state: true },
	  changedRelease: { state: true },
	  changedAttack: { state: true }
	};

	static styles = css`
		.title {
	    	width: 294px;
	    }

	    sc-number {
	    	width: 140px;
	    	margin: 4px;
	    }

	    sc-text {
	    	width: 140px;
	    	margin: 4px;
	    }

	    .separator {
	    	height: 100px;
	    }
	`;

	constructor() {
		super();

		this.id = 0;
		this.params = null;
		this.enveloppes = {};
		// this.selectedBank = null;

		this.scheduler = null;
		this.audioContext = null;
		this.engine = null;

		this.currentEnveloppe = null;
		this.interDuration = null;

		this.changedRelease = false;
		this.changedAttack = false;

		this.transportState = "stop";

		this.timeoutFunc = null;
		this.currentTime = 0;

		this.process = this.process.bind(this);
	}

	process(currentTime, processorTime, event) {
		const localEnv = structuredClone(this.enveloppes);
		// pick a random enveloppe in the correct folder
		const folder = localEnv[this.params.corpus][`source ${this.id+1}`];
		const randomEnv = Math.floor(Math.random() * Object.keys(folder).length);
		this.currentEnveloppe = Object.keys(folder)[randomEnv];
		const file = folder[this.currentEnveloppe];

		const randomEvntDur = getRandomNumber(this.params.minEvntDur, this.params.maxEvntDur);
		const evntDur = this.getFileDuration(file);
		const evntRatio = randomEvntDur / evntDur;

		file.stationary1 = file.stationary1 * evntRatio;
		file.stationary2 = file.stationary2 * evntRatio;
		file.stationary3 = file.stationary3 * evntRatio;
		file.decay = file.decay * evntRatio;

		if (this.changedRelease) {

			file.release = getRandomNumber(this.params.minRelease, this.params.maxRelease);

			this.changedRelease = false;
			this.requestUpdate();
		}

		if (this.changedAttack) {

			file.attack = getRandomNumber(this.params.minAttack, this.params.maxAttack);

			this.changedAttack = false;
			this.requestUpdate();
		}

		this.engine.state = file;

		this.engine.start(currentTime);
	  
	    // define a period in seconds according to BPM and compute next time
	    this.interDuration = getRandomNumber(this.params.minInterDur, this.params.maxInterDur)
	    const nextTime = currentTime + this.interDuration + this.engine.getEventDuration();
	    // return the next time at which the process should play
	    return nextTime;
  	}

  	connectedCallback() {
  		super.connectedCallback();
  		this.interDuration = this.params.minInterDur;
  		// this.params.corpus = Object.keys(this.enveloppes)[0];
  	}

  	getFileDuration(file) {
  		return file.stationary1 + file.decay + file.stationary2 + file.stationary3;
  	}

	render() {

		return html`
			<div>
				<sc-text class="title" value="Electroaimant ${this.id + 1}"></sc-text>
				<sc-transport
					value="${this.transportState}" 
					.buttons=${['start', 'stop']}
					@change=${e => this.transport(e.detail.value)}
				></sc-transport>
				<sc-text value="change release time"></sc-text>
				<sc-toggle
					.active="${this.changedRelease}"
            		@change=${e => this.changedRelease = true}
          		></sc-toggle>
				<sc-text value="change attack time"></sc-text>
				<sc-toggle
					.active="${this.changedAttack}"
            		@change=${e => this.changedAttack = true}
          		></sc-toggle>
			</div>
			<div>
				<sc-text value="Current enveloppe"></sc-text>
				<sc-text value="silence duration"></sc-text>
				<sc-text value="evnt duration"></sc-text>
				<sc-text value="attack"></sc-text>
				<sc-text value="release"></sc-text>
				<sc-text value="temps restant"></sc-text>
			</div>
			<div>
				<sc-text value="${this.currentEnveloppe}"></sc-text>
				<sc-text value="${this.interDuration.toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getEventDuration().toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getAttack().toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getRelease().toFixed(2)}"></sc-text>
				<sc-text value="${this.currentTime.toFixed(2)}"></sc-text>
			</div>
			<div class="separator"></div>
		`;
	}

	// triggerTransport(value) {
	// 	console.log("triggerTransport");

	// 	switch(value) {
	// 		case "start":
	// 			setTimeout(() => {
	// 				this.transportState = "start";
	// 				this.transport("start");
	// 			}, getRandomNumber(1, 5) * 1000);
	// 			break;
	// 		case "stop":
	// 			this.transportState = "stop";
	// 			this.transport = "stop";
	// 			break;
	// 	}
	// }

	transport(e) {
		switch(e) {
		case 'start':

			this.scheduler.add(this.process, this.audioContext.currentTime + 0.05);

			this.timeoutFunc = setInterval(() => {
				this.currentTime = this.engine.getCurrentTime() + this.interDuration;
	    	}, 100);

			break;
		case 'stop':

			clearInterval(this.timeoutFunc);

			this.engine.stop();
			this.scheduler.remove(this.process, this.audioContext.currentTime + 0.05);
			break;
		}
	}
}


customElements.define('individual-div', IndividualDiv);