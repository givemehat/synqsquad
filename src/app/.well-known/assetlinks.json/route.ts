import { NextResponse } from "next/server";

export async function GET() {
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.synqsquad.app",
        sha256_cert_fingerprints: [
          "BC:8E:FA:C2:15:09:23:6F:97:7C:7A:E8:84:B4:C9:8D:81:E1:55:16:55:53:51:37:98:CC:B5:BD:5C:29:61:C9",
        ],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
