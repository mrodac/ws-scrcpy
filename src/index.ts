import { DeviceConnection, IErrorListener } from './DeviceConnection';
import NativeDecoder from './decoder/NativeDecoder';
import { BroadwayDecoder, CANVAS_TYPE } from './decoder/BroadwayDecoder';
import Decoder from './decoder/Decoder';
import VideoSettings from './VideoSettings';
import H264bsdDecoder from './decoder/H264bsdDecoder';
import ErrorHandler from './ErrorHandler';
import TextControlEvent from './controlEvent/TextControlEvent';
import CommandControlEvent from './controlEvent/CommandControlEvent';
import Size from './Size';
import { IDevice } from './server/ServerDeviceConnection';

interface IStartArguments {
    stream: VideoSettings;
    connection: DeviceConnection;
    decoderName: string;
    decoder: Decoder;
    startText: string;
    onclick(): void;
}

class Main implements IErrorListener {
    private static inputWrapperId: string = 'inputWrap';
    private static controlsWrapperId: string = 'controlsWrap';
    private static commandsWrapperId: string = 'commandsWrap';
    private static addressInputId: string = 'deviceAddress';
    private static instance?: Main;

    constructor() {
        Main.instance = this;
    }

    public static getInstance(): Main {
        return Main.instance || new Main();
    }

    public OnError(ev: string | Event): void {
        console.error(ev);
    }

    private static getAddress(): string | null {
        const addressInput = document.getElementById(Main.addressInputId);
        if (addressInput && addressInput instanceof HTMLInputElement) {
            return addressInput.value || null;
        }
        return null;
    }

    public startNative(this: HTMLButtonElement): void {
        const tag: HTMLVideoElement = document.getElementById('videoTagId') as HTMLVideoElement;
        const url = Main.getAddress();
        if (!tag || !url) {
            return;
        }
        tag.style.display = 'block';
        const decoder = new NativeDecoder(tag);
        const main = Main.getInstance();
        const onclick = main.startNative;
        const startText = this.innerText;
        const decoderName = 'Native';
        const connection = DeviceConnection.getInstance(url);
        const stream = NativeDecoder.preferredVideoSettings;
        connection.addDecoder(decoder);
        main.start.call(this, {
            connection,
            decoder,
            decoderName,
            onclick,
            startText,
            stream
        });
    }

    public startBroadway(this: HTMLButtonElement): void {
        const tag: HTMLCanvasElement = document.getElementById('canvasTagId') as HTMLCanvasElement;
        const url = Main.getAddress();
        if (!tag || !url) {
            return;
        }
        tag.style.display = 'block';
        const decoder = new BroadwayDecoder(tag, CANVAS_TYPE.WEBGL);
        const main = Main.getInstance();
        const onclick = main.startBroadway;
        const startText = this.innerText;
        const decoderName = 'Broadway';
        const connection = DeviceConnection.getInstance(url);
        const stream = BroadwayDecoder.preferredVideoSettings;
        connection.addDecoder(decoder);
        main.start.call(this, {
            connection,
            decoder,
            decoderName,
            onclick,
            startText,
            stream
        });
    }

    public startH264bsd(this: HTMLButtonElement): void {
        const tag: HTMLCanvasElement = document.getElementById('canvasTagId') as HTMLCanvasElement;
        const url = Main.getAddress();
        if (!tag || !url) {
            return;
        }
        tag.style.display = 'block';
        const decoder = new H264bsdDecoder(tag);
        const main = Main.getInstance();
        const onclick = main.startH264bsd;
        const startText = this.innerText;
        const decoderName = 'H264bsdDecoder';
        const connection = DeviceConnection.getInstance(url);
        const stream = H264bsdDecoder.preferredVideoSettings;
        connection.addDecoder(decoder);
        main.start.call(this, {
            connection,
            decoder,
            decoderName,
            onclick,
            startText,
            stream
        });
    }

    public start(this: HTMLButtonElement, params: IStartArguments): void {
        const {connection, decoder, decoderName, onclick, startText, stream} = params;

        this.innerText = `Stop ${decoderName}`;

        const controlsWrapper = document.getElementById(Main.controlsWrapperId);
        if (!controlsWrapper) {
            return;
        }
        const textWrap = document.createElement('div');
        textWrap.id = Main.inputWrapperId;
        const input = document.createElement('input');
        const sendButton = document.createElement('button');
        sendButton.innerText = 'Send';
        textWrap.appendChild(input);
        textWrap.appendChild(sendButton);

        controlsWrapper.appendChild(textWrap);
        sendButton.onclick = () => {
            if (input.value) {
                connection.sendEvent(new TextControlEvent(input.value));
            }
        };
        const cmdWrap = document.createElement('div');
        cmdWrap.id = Main.commandsWrapperId;
        const codes = CommandControlEvent.CommandCodes;
        for (const command in codes) {
            if (codes.hasOwnProperty(command)) {
                const action: number = codes[command];
                const btn = document.createElement('button');
                let bitrateInput: HTMLInputElement;
                let frameRateInput: HTMLInputElement;
                let iFrameIntervalInput: HTMLInputElement;
                if (action === CommandControlEvent.CommandCodes.COMMAND_SET_VIDEO_SETTINGS) {
                    const bitrateWrap = document.createElement('div');
                    const bitrateLabel = document.createElement('label');
                    bitrateLabel.innerText = 'Bitrate:';
                    bitrateInput = document.createElement('input');
                    bitrateInput.placeholder = `bitrate (${stream.bitrate})`;
                    bitrateInput.value = stream.bitrate.toString();
                    bitrateWrap.appendChild(bitrateLabel);
                    bitrateWrap.appendChild(bitrateInput);

                    const framerateWrap = document.createElement('div');
                    const framerateLabel = document.createElement('label');
                    framerateLabel.innerText = 'Framerate:';
                    frameRateInput = document.createElement('input');
                    frameRateInput.placeholder = `framerate (${stream.frameRate})`;
                    frameRateInput.value = stream.frameRate.toString();
                    framerateWrap.appendChild(framerateLabel);
                    framerateWrap.appendChild(frameRateInput);

                    const iFrameIntervalWrap = document.createElement('div');
                    const iFrameIntervalLabel = document.createElement('label');
                    iFrameIntervalLabel.innerText = 'I-Frame Interval:';
                    iFrameIntervalInput = document.createElement('input');
                    iFrameIntervalInput.placeholder = `I-frame interval (${stream.iFrameInterval})`;
                    iFrameIntervalInput.value = stream.iFrameInterval.toString();
                    iFrameIntervalWrap.appendChild(iFrameIntervalLabel);
                    iFrameIntervalWrap.appendChild(iFrameIntervalInput);

                    cmdWrap.appendChild(bitrateWrap);
                    cmdWrap.appendChild(framerateWrap);
                    cmdWrap.appendChild(iFrameIntervalWrap);
                }
                btn.innerText = command;
                btn.onclick = () => {
                    let event: CommandControlEvent;
                    if (action === CommandControlEvent.CommandCodes.COMMAND_SET_VIDEO_SETTINGS) {
                        const bitrate = parseInt(bitrateInput.value, 10);
                        const frameRate = parseInt(frameRateInput.value, 10);
                        const iFrameInterval = parseInt(iFrameIntervalInput.value, 10);
                        if (isNaN(bitrate) || isNaN(frameRate)) {
                            return;
                        }
                        const width = document.body.clientWidth & ~15;
                        const height = document.body.clientHeight & ~15;
                        const bounds: Size = new Size(width, height);
                        event = CommandControlEvent.createSetVideoSettingsCommand(new VideoSettings({
                            bounds,
                            bitrate,
                            frameRate,
                            iFrameInterval,
                            sendFrameMeta: false
                        }));
                    } else {
                        event = new CommandControlEvent(action);
                    }
                    connection.sendEvent(event);
                };
                cmdWrap.appendChild(btn);
            }
        }
        controlsWrapper.appendChild(cmdWrap);

        const stop = (ev?: string | Event) => {
            if (ev && ev instanceof Event && ev.type === 'error') {
                console.error(ev);
            }
            connection.removeDecoder(decoder);
            this.innerText = startText;
            this.onclick = onclick;
            const tag = decoder.getElement();
            if (tag) {
                tag.style.display = 'none';
            }
            let parent;
            parent = textWrap.parentElement;
            if (parent) {
                parent.removeChild(textWrap);
            }
            parent = cmdWrap.parentElement;
            if (parent) {
                parent.removeChild(cmdWrap);
            }
        };

        this.onclick = stop;

        connection.setErrorListener(new ErrorHandler(stop));
    }

    public listen(): void {
        const ws = new WebSocket(`ws://${location.host}/`);
        const onclick = function(this: GlobalEventHandlers): void {
            if (!(this instanceof HTMLButtonElement)) {
                return;
            }
            const addressInput = document.getElementById(Main.addressInputId);
            if (addressInput && addressInput instanceof HTMLInputElement) {
                const ip = this.getAttribute('data-ip');
                if (ip) {
                    addressInput.value = `ws://${ip}:8886/`;
                }
            }
        };
        ws.onclose = () => {
            console.log('Connection closed');
            setTimeout(() => {
                this.listen();
            }, 2000);
        };
        ws.onmessage = (e: MessageEvent) => {
            let data: IDevice[];
            try {
                data = JSON.parse(e.data);
            } catch (error) {
                console.error(error.message);
                console.log(e.data);
                return;
            }
            const devices = document.getElementById('devices');
            if (!devices) {
                return;
            }
            const children = devices.children;
            /* tslint:disable: prefer-for-of */
            for (let i = 0; i < children.length; i++) {
                const element = children[i];
                const udid = element.getAttribute('data-udid');
                const list = data.filter(item => item.udid === udid);
                if (!list.length) {
                    devices.removeChild(element);
                }
            }
            /* tslint:enable*/
            data.forEach(item => {
                let element = document.getElementById(item.udid);
                if (!element) {
                    element = document.createElement('button');
                    element.id = item.udid;
                    if (children.length) {
                        devices.insertBefore(element, children[0]);
                    } else {
                        devices.appendChild(element);
                    }
                    element.innerText = `${item.manufacturer} ${item.model}`;
                    element.setAttribute('data-udid', item.udid);
                    element.onclick = onclick;
                }
                element.setAttribute('data-ip', item.ip);
            });
        };
    }
}

window.onload = function(): void {
    const btnNative = document.getElementById('startNative');
    if (btnNative && btnNative instanceof HTMLButtonElement) {
        btnNative.onclick = Main.getInstance().startNative.bind(btnNative);
    }
    const btnBroadway = document.getElementById('startBroadway');
    if (btnBroadway && btnBroadway instanceof HTMLButtonElement) {
        btnBroadway.onclick = Main.getInstance().startBroadway.bind(btnBroadway);
    }
    const h264bsd = document.getElementById('startH264bsd');
    if (h264bsd && h264bsd instanceof HTMLButtonElement) {
        h264bsd.onclick = Main.getInstance().startH264bsd.bind(h264bsd);
    }
    Main.getInstance().listen();
};
