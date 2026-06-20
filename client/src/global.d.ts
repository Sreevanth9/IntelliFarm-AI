declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}
declare module "*.css";
declare module "*.svg" {
  const content: string;
  export default content;
}
declare module "*.png" {
  const content: string;
  export default content;
}
declare module "*.jpg" {
  const content: string;
  export default content;
}
declare module "*.json" {
  const value: any;
  export default value;
}
