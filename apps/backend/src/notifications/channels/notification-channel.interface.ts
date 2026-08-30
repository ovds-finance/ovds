/**
 * Abstract channel contract — every transport adapter must implement this.
 * New channels (Telegram, Slack, etc.) can be added by implementing this interface
 * and registering as an injectable provider.
 */
export interface INotificationChannel<TPayload = unknown> {
  readonly channelName: string;
  send(payload: TPayload): Promise<void>;
}
