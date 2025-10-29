import Bun from 'bun';

import type { FreeformTag, RawStream, Stream, TwitchAPIStream } from './types';

const CATEGORY = 'shell-shockers';

const clientIdReq = await (await fetch('https://www.twitch.tv/directory/category/' + CATEGORY)).text();
const clientId = clientIdReq.match(/clientId="(.*?)"/)![1];

const getStreams = async () => {
    const gameReq = await (await fetch('https://gql.twitch.tv/gql', {
        'headers': {
            'client-id': clientId!,
            'content-type': 'text/plain;charset=UTF-8',
            'Referer': 'https://www.twitch.tv/'
        },
        'body': JSON.stringify([
            {
                'operationName': 'Directory_DirectoryBanner',
                'variables': { 'slug': CATEGORY },
                'extensions': {
                    'persistedQuery': {
                        'version': 1,
                        'sha256Hash': '822ecf40c2a77568d2b223fd5bc4dfdc9c863f081dd1ca7611803a5330e88277'
                    }
                }
            },
            {
                'operationName': 'DirectoryPage_Game',
                'variables': {
                    'imageWidth': 50,
                    'slug': CATEGORY,
                    'options': {
                        'sort': 'RELEVANCE',
                        'recommendationsContext': { 'platform': 'web' },
                        'requestID': 'JIRA-VXP-2397',
                        'freeformTags': null,
                        'tags': [],
                        'broadcasterLanguages': [],
                        'systemFilters': []
                    },
                    'sortTypeIsRecency': false,
                    'limit': 50,
                    'includeIsDJ': true
                },
                'extensions': {
                    'persistedQuery': {
                        'version': 1,
                        'sha256Hash': 'c7c9d5aad09155c4161d2382092dc44610367f3536aac39019ec2582ae5065f9'
                    }
                }
            }
        ]),
        'method': 'POST'
    })).json() as any;

    const streams = gameReq[1].data.game.streams.edges.map((e: { node: TwitchAPIStream }) => e.node) as RawStream[];
    return streams.map((stream: RawStream) => reformateStream(stream));
}

const reformateStream = (stream: RawStream): Stream => {
    return {
        isPermanent: stream.isPermanent || false,
        id: stream.id,
        streamTitle: stream.title,
        viewers: stream.viewersCount,
        streamer: {
            name: stream.broadcaster.login,
            isPartner: stream.broadcaster.roles.isPartner,
            profileImage: stream.broadcaster.profileImageURL,
            color: stream.broadcaster.primaryColorHex
        },
        tags: stream.freeformTags.map((tag: FreeformTag) => tag.name)
    }
}

const connectToStreamer = (streamName: string, callback: (code: string) => void) => {
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv/');

    ws.onopen = () => {
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        ws.send('PASS SCHMOOPIIE');
        ws.send('NICK justinfan20516');
        ws.send('USER justinfan20516 8 * :justinfan20516');
        ws.send('JOIN #' + streamName);
    }

    ws.onmessage = (m) => {
        if (m.data.includes(' PRIVMSG ')) {
            const code = m.data.match(/[a-z]{4}-[a-z]{4}-[a-z]{4}/)?.[0];
            callback(code);
        }
    }

    ws.onclose = () => connectToStreamer(streamName, callback);
}

let streams = await getStreams();
let lastFetch = Date.now();

let inStreams: string[] = [];
let codes: { [key: string]: string } = {};

const checkAndJoin = () => streams.forEach((stream) => {
    if (!inStreams.includes(stream.streamer.name)) {
        inStreams.push(stream.streamer.name);
        console.log('joining ' + stream.streamer.name);
        connectToStreamer(stream.streamer.name, (code) => code && (codes[stream.streamer.name] = code));
    }
});

checkAndJoin();

Bun.serve({
    port: 4221,

    async fetch() {
        if (lastFetch < (Date.now() - (1000 * 10))) {
            console.log('time to refresh!');
            streams = await getStreams();
            checkAndJoin();
        }

        console.log('sending back', streams.length, 'streams');

        return new Response(JSON.stringify({ streams, codes }), {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        });
    }
});

console.log('$ http://localhost:4221');