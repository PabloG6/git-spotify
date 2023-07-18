export interface SpotifyRequest<T> {
    href: string;
    items: T[]
    next: string;
    offset: number;
}