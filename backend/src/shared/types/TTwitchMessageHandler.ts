import { ChatUserstate } from 'tmi.js'

export type TTwitchMessageHandler = (
    channel: string,
    tags: ChatUserstate,
    message: string,
    self: boolean
) => void;
