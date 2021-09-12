import awsmobile from "../aws-exports";

export const environment = {
  production: true,
  urlString: awsmobile.aws_cloud_logic_custom ?  awsmobile.aws_cloud_logic_custom[0].endpoint : ""
};
