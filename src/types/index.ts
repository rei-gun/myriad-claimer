export interface GunUser {
  is: {
    pub: string,
    epub: string,
    alias: string,
  },
  get(s: string): any 
}