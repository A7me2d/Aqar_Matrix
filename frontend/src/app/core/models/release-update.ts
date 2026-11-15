export interface ReleaseUpdate {
  readonly state:'checking'|'latest'|'available'|'unpublished'|'error';
  readonly message:string;
  readonly currentVersion?:string;
  readonly latestVersion?:string|null;
}
