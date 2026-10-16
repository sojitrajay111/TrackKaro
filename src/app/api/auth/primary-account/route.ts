import { NextResponse } from "next/server";

export async function POST() {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWEyODg3NTU1Njc1MTIwNmFjYTlhMjYiLCJlbWFpbCI6Impzb2ppdHJhMTExQGdtYWlsLmNvbSIsImlhdCI6MTc5MjE0NTM4NywiZXhwIjoxNzk0NzM3Mzg3fQ.QZXmqfeY9joj2-kVvbctFVJJObhcZxGnwXCd1YOR8ww";

  const user = {
    id: "6aa28875556751206aca9a26",
    name: "Jay Sojitra",
    email: "jsojitra111@gmail.com",
    phone: "7861819040",
  };

  return NextResponse.json({
    accessToken: token,
    refreshToken: "mock-refresh-token",
    accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    user,
  });
}
