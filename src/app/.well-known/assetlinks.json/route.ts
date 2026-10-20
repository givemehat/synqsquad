import { NextResponse } from "next/server";

export async function GET() {
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.synqsquad.app",
        "sha256_cert_fingerprints": [
          "5D:16:70:7C:8B:D0:BE:A5:6B:F5:EF:ED:79:F5:B7:F0:38:FE:DB:72:12:E2:D8:9B:4C:FE:C6:C1:7D:00:F3:BD",
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
