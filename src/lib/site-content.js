import { cache } from "react";
import { siteContentDefaults } from "../data/site-content-defaults";

export const getPublicSiteContent = cache(async () => siteContentDefaults);
