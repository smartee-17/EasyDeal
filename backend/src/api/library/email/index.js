
import emailService from "./emailService";
import EMAIL_TYPES from "./emailTypes";
import emailTemplates from "./emailTemplates";

 export default {
  ...emailService,
  EMAIL_TYPES,
  emailTemplates, 
};
