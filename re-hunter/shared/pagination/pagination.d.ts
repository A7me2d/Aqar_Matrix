export interface PageState {
  readonly view?: string;
  readonly page:number;
  readonly pageSize:number;
  readonly totalItems:number;
  readonly totalPages:number;
  readonly from:number;
  readonly to:number;
  readonly pages:readonly (number|null)[];
}
