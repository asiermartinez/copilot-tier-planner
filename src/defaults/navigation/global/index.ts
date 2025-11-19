import { enterprise } from "./enterprise";
import { organization } from "./organization";
import { repository } from "./repository";
import { user } from "./user";

export const globalNavigationItems = {
  enterprise,
  organization,
  repository,
  user,
} as const;
