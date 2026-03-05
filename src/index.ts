import type { Core } from "@strapi/strapi";

const WATCHED_CONTENT_TYPES = [
  "api::article-kapaciti.article-kapaciti",
  "api::career-kapaciti.career-kapaciti",
];

let rebuildTimeout: ReturnType<typeof setTimeout> | null = null;

const triggerGitHubRebuild = () => {
  if (rebuildTimeout) {
    clearTimeout(rebuildTimeout);
  }

  rebuildTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/dispatches",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_PAT}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "strapi-content-update",
          }),
        }
      );
      console.log(`GitHub rebuild triggered: ${response.status}`);
    } catch (error) {
      console.error("GitHub dispatch failed:", error);
    }
  }, 10000);
};

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    strapi.documents.use(async (context, next) => {
      const result = await next();

      if (
        WATCHED_CONTENT_TYPES.includes(context.contentType.uid) &&
        ["create", "update", "delete", "publish", "unpublish"].includes(
          context.action
        )
      ) {
        triggerGitHubRebuild();
      }

      return result;
    });
  },
};
