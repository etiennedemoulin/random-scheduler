import {LitElement, html, css, nothing} from 'lit';

import '@ircam/sc-components';
import './IndividualDiv.js';

import { Engine } from './Engine.js';
import { getRandomNumber } from './utils.js'

class MainDiv extends LitElement {

    static properties = {
      enveloppes: {state: true}
    };

  static styles = css`
    .separator {
      height: 40px;
    }

    .head {
      width: 200px;
      margin: 4px;
    }


    sc-text {
        width: 140px;
        margin: 4px;
    }

    sc-number {
        width: 140px;
        margin: 4px;
    }


  `;

  constructor() {
    super();
    this.numChannels = null;
    this.enveloppes = {};

    this.scheduler = null;
    this.audioContext = null;

    this.merger = null;

    this.transportState = "stop";

    this.params = {
      minInterDur:0,
      maxInterDur:0,
      minEvntDur:0,
      maxEvntDur:0,
      minRelease:0,
      maxRelease:0,
      minAttack:0,
      maxAttack:0,
      minCorpusChange:0,
      maxCorpusChange:0,
      corpus:null,
      changedRelease:false,
      mute:false
    };

    this.dirHandle1 = null;

    this.enveloppeList = [];

    this.process = this.process.bind(this);

  }

  connectedCallback() {
    super.connectedCallback();

    this.merger = this.audioContext.createChannelMerger(this.numChannels);
    this.merger.channelInterpretation = "discrete";
    this.merger.connect(this.audioContext.destination);

    this.params.corpus = Object.keys(this.enveloppes)[0];


    console.log(this.enveloppeList);

  }

  process(currentTime, processorTime, event) {

    // const envList = Object.keys(this.enveloppes);
    const randomInt = Math.floor(Math.random() * this.enveloppeList.length);
    this.params.corpus = this.enveloppeList[randomInt];

    // console.log("current corpus", this.params.corpus);
    this.requestUpdate();

    const nextTime = currentTime + getRandomNumber(this.params.minCorpusChange, this.params.maxCorpusChange);
    return nextTime;

  }

  render() {

    const active = Object.keys(this.enveloppes).length !== 0;
    // console.log(this.params.mute);

    return html`
      <div>
      <h1>${active?"":"Please select folder"}</h1>
      <sc-text class="head" value="Select enveloppes folder"></sc-text>
      <sc-button
        value="Read"
        @input=${this.loadDirectory}
      ></sc-button>
      ${active ? html`
        <sc-button
          value="Save"
          @input=${this.saveConfig}
        ></sc-button>
      ` : nothing}
      </div>
      ${active ? html`
        <div>
          <sc-text value="min silence"></sc-text>
          <sc-text value="max silence"></sc-text>
          <sc-text value="min evnt duration"></sc-text>
          <sc-text value="max evnt duration"></sc-text>
          <sc-text value="current corpus"></sc-text>
        </div>
        <div>
          <sc-number
            min=0
            value=${this.params.minInterDur}
            @input=${e => this.params.minInterDur = e.detail.value}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.maxInterDur}
            @input=${e => this.params.maxInterDur = e.detail.value}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.minEvntDur}
            @input=${e => this.params.minEvntDur = e.detail.value}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.maxEvntDur}
            @input=${e => this.params.maxEvntDur = e.detail.value}
          ></sc-number>
          <sc-select
            value="${this.params.corpus}"
              options="${JSON.stringify(this.enveloppeList)}"
              @change=${e => this.params.corpus = e.target.value}
          ></sc-select>
        </div>
        <div>
          <sc-text value="min release"></sc-text>
          <sc-text value="max release"></sc-text>
        </div>
        <div>
          <sc-number
            min=0
            value=${this.params.minRelease}
            @input=${e => this.params.minRelease = e.detail.value}
          ></sc-number>
          <sc-number
            min=0
            value=${this.params.maxRelease}
            @input=${e => this.params.maxRelease = e.detail.value}
          ></sc-number>
        </div>
      ` : nothing}
      <div class="separator"></div>

      ${active ? html`
        <div>
          ${[...Array(this.numChannels).keys()].map(id => {
            const engine = new Engine(this.audioContext);
            engine.connect(this.merger, 0, id);
            return html`
              <individual-div 
                .id=${id} 
                .params=${this.params} 
                .transportState=${this.transportState}
                .enveloppes=${this.enveloppes} 
                .scheduler=${this.scheduler} 
                .audioContext=${this.audioContext} 
                .engine=${engine}
              ></individual-div>
            `;
        })}
        </div>
      ` : nothing}
    `;
  }

  async saveConfig() {

    const contents = JSON.stringify(this.params);
    const fileHandle = await this.dirHandle1.getFileHandle("config.json", { create: true });

    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(contents);
    // Close the file and write the contents to disk.
    await writable.close();
  }

  transport(e) {
    switch(e) {
    case 'start':
      // this.transportState = "start";

      this.scheduler.add(this.process, this.audioContext.currentTime + 0.05);
      this.requestUpdate();
      break;
    case 'stop':
      // this.transportState = "stop";
      this.scheduler.remove(this.process, this.audioContext.currentTime + 0.05);
      this.requestUpdate();
      break;
    }
  }

  async loadDirectory() {

    this.dirHandle1 = await window.showDirectoryPicker();
    for await (const entry1 of this.dirHandle1.values()) {

      if (entry1.kind === "directory") {

        this.enveloppes[entry1.name] = {};

        const dirHandle2 = await this.dirHandle1.getDirectoryHandle(entry1.name);

        for await (const entry2 of dirHandle2.values()) {

          if (entry2.kind === "directory") {

            this.enveloppes[entry1.name][entry2.name] = {};

            const dirHandle3 = await dirHandle2.getDirectoryHandle(entry2.name);

            for await (const entry3 of dirHandle3.values()) {

              if (entry3.kind === 'file' && entry3.name !== '.DS_Store') {

                const fileHandle = await dirHandle3.getFileHandle(entry3.name);
                const file = await fileHandle.getFile();
                const contents = await file.text();
                this.enveloppes[entry1.name][entry2.name][entry3.name] = JSON.parse(contents);
              }
            } 
          }
        }
      } else {
        if (entry1.name === 'config.json') {
          const fileHandle = await this.dirHandle1.getFileHandle(entry1.name);
          const file = await fileHandle.getFile();
          const contents = await file.text();
          this.params = JSON.parse(contents);
        }
      }
    };

    if (Object.keys(this.enveloppes).length > 0) {
      this.enveloppeList = Object.keys(this.enveloppes);
    }

    this.requestUpdate();

  }
}
customElements.define('main-div', MainDiv);

