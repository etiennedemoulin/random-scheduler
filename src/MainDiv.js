import {LitElement, html, css, nothing} from 'lit';

import '@ircam/sc-components';
import './IndividualDiv.js';

import { Engine } from './Engine.js';

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

    this.params = {
      minInterDur:0,
      maxInterDur:0
    };

    this.dirHandle1 = null;

  }

  connectedCallback() {
    super.connectedCallback();

    this.merger = this.audioContext.createChannelMerger(this.numChannels);
    this.merger.channelInterpretation = "discrete";
    this.merger.connect(this.audioContext.destination);

  }

  render() {

    const active = Object.keys(this.enveloppes).length !== 0;

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

              if (entry3.kind === 'file') {

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

    this.requestUpdate();


  }


}
customElements.define('main-div', MainDiv);

