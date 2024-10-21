import jwt from "jsonwebtoken";
import crypto from "crypto";

const skywaySecret = process.env.SKYWAY_SECRET_KEY;
const skywayApplicationId = process.env.SKYWAY_APPLICATION_ID;

export async function POST() {
  const nowInSec = Math.floor(Date.now() / 1000);
  const token = jwt.sign({
    jti: crypto.randomUUID(),
    iat: nowInSec,
    exp: nowInSec + 60 * 60 * 24,
    scope: {
      app: {
        id: skywayApplicationId,
        turn: true,
        actions: ["read"],
        channels: [
          {
            id: "*",
            name: "*",
            actions: ["write"],
            members: [
              {
                id: "*",
                name: "*",
                actions: ["write"],
                publication: {
                  actions: ["write"],
                },
                // attendee はサブスクリプションの作成不可
                // subscription: {
                //   actions: ["write"],
                // },
              },
            ]
          },
        ],
      },
    },
  }, skywaySecret);
  return Response.json({ token });
}