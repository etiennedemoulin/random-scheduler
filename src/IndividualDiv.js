import { LitElement, html, css, nothing } from 'lit';

import '@ircam/sc-components';

class IndividualDiv extends LitElement {

	static properties = {
	  enveloppes: {
	    hasChanged() { return true }
	  },
	  id: {
	  	type: Number
	  },
	  currentEnveloppe: { state: true },
	  interDuration: { state: true }
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
		this.selectedBank = null;

		this.scheduler = null;
		this.audioContext = null;
		this.engine = null;

		this.currentEnveloppe = null;
		this.interDuration = null;

		this.process = this.process.bind(this);
	}

	getRandomNumber(min, max) {
			return Math.random() * (max - min) + min
	}


	process(currentTime, processorTime, event) {
		// pick a random enveloppe in the correct folder
		const folder = this.enveloppes[`EA${this.id+1}`][this.selectedBank];
		const randomInt = Math.floor(Math.random() * Object.keys(folder).length);
		this.currentEnveloppe = Object.keys(folder)[randomInt];
		const file = folder[this.currentEnveloppe];

		this.engine.state = file;

		this.engine.start(currentTime);
	  
	    // define a period in seconds according to BPM and compute next time
	    this.interDuration = this.getRandomNumber(this.params.minInterDur, this.params.maxInterDur)
	    const nextTime = currentTime + this.interDuration + this.engine.getEventDuration();
	    // return the next time at which the process should play
	    return nextTime;
  	}

  	connectedCallback() {
  		super.connectedCallback();
  		this.interDuration = this.params.minInterDur;
  		this.selectedBank = Object.keys(this.enveloppes[`EA${this.id+1}`])[0];
  	}

	render() {

		let envList;
		if (Object.keys(this.enveloppes).length > 0) {
			envList = Object.keys(this.enveloppes[`EA${this.id+1}`]);
		} else {
			envList = []
		}

		return html`
			<div>
				<sc-text class="title" value="Electroaimant ${this.id + 1}"></sc-text>
				<sc-transport
					value="stop" 
					.buttons=${['start', 'stop']}
					@change=${e => this.transport(e.detail.value)}
					></sc-transport>
				<sc-select
  					options="${JSON.stringify(envList)}"
  					@change=${e => this.selectedBank = e.target.value}
				></sc-select>
			</div>
			<div>
				<sc-text value="Current enveloppe"></sc-text>
				<sc-text value="silence duration"></sc-text>
				<sc-text value="evnt duration"></sc-text>
			</div>
			<div>
				<sc-text value="${this.currentEnveloppe}"></sc-text>
				<sc-text value="${this.interDuration.toFixed(2)}"></sc-text>
				<sc-text value="${this.engine.getEventDuration()}"></sc-text>
			</div>
			<div class="separator"></div>
		`;
	}

	transport(e) {
		switch(e) {
		case 'start':
			this.scheduler.add(this.process, this.audioContext.currentTime + 0.05);
			break;
		case 'stop':
			this.engine.stop();
			this.scheduler.remove(this.process, this.audioContext.currentTime + 0.05);
			break;
		}
	}
}


customElements.define('individual-div', IndividualDiv);