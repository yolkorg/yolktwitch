export interface UserRoles {
    isPartner: boolean;
    isParticipatingDJ: boolean;
    __typename: 'UserRoles';
}

export interface User {
    id: string;
    login: string;
    displayName: string;
    roles: UserRoles;
    profileImageURL: string;
    primaryColorHex: string | null;
    __typename: 'User';
}

export interface FreeformTag {
    id: string;
    name: string;
    __typename: 'FreeformTag';
}

export interface Game {
    id: string;
    boxArtURL: string;
    name: string;
    displayName: string;
    slug: string;
    __typename: 'Game';
}

export interface PreviewThumbnailProperties {
    blurReason: 'BLUR_NOT_REQUIRED' | string;
    __typename: 'PreviewThumbnailProperties';
}

export interface TwitchAPIStream {
    id: string;
    title: string;
    viewersCount: number;
    previewImageURL: string;
    broadcaster: User;
    freeformTags: FreeformTag[];
    type: 'live' | string;
    game: Game;
    previewThumbnailProperties: PreviewThumbnailProperties;
    __typename: 'Stream';
}

export interface RawStream extends TwitchAPIStream {
    isPermanent: boolean;
}

export interface Stream {
    isPermanent: boolean;
    id: string;
    streamTitle: string;
    viewers: number;
    streamer: {
        name: string;
        isPartner: boolean;
        profileImage: string;
        color: string | null;
    };
    tags: string[];
}