import { TChatSource } from '../types'

export interface IChatPayload {
    source: TChatSource;
    user: string;
    message: string;
    timestamp: string;
    avatar: string | null;
}
