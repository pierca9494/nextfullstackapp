import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { AUTHOR_BY_GITHUB_ID_QUERY } from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async signIn({ user: { name, email, image }, profile }) {
      const login = profile?.login || "default_username";
      const id = profile?.id || "";
      const bio = profile?.bio || "";

      const existingUser = await client.fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
        id,
      });

      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          _id: `github-${id}`, // Unique ID for GitHub users in Sanity
          name,
          username: login,
          email,
          image,
          bio,
        });
      }

      return true;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const user = await client.fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
          id: profile.id,
        });

        if (user) {
          token.id = user._id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = { ...session.user, id: String(token.id || "") };
      return session;
    },
  },
});
