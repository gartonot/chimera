import { IChatPayload } from './index';

export interface IServerToClientEvents {
    chatMessage: (payload: IChatPayload) => void;
}
