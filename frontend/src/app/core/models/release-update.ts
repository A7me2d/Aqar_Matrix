export interface ReleaseUpdate {
  readonly state:'checking'|'latest'|'available'|'unpublished'|'error'|'downloading'|'verifying'|'installing';
  readonly message:string;
  readonly currentVersion?:string;
  readonly latestVersion?:string|null;
  readonly percent?:number;
  readonly transferred?:number;
  readonly total?:number;
  readonly bytesPerSecond?:number;
  readonly automatic?:boolean;
  readonly canRetry?:boolean;
}
