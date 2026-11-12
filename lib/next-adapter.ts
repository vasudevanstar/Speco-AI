import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from './auth';

export function expressAdapter(
  controllerFn: (req: any, res: any, next: any) => Promise<void>,
  requireAuth = false
) {
  return async (req: NextRequest, { params }: { params?: any } = {}) => {
    let user = null;
    if (requireAuth) {
      user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
    }

    let body = {};
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        body = await req.json();
      }
    } catch (e) {
      // Ignored if no JSON body
    }

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const reqParams = params || {};

    const expressReq = {
      body,
      query,
      params: reqParams,
      user,
      headers: {
        authorization: req.headers.get('authorization'),
      },
    };

    return new Promise<NextResponse>((resolve) => {
      let statusCode = 200;
      let headers: Record<string, string> = {};

      const expressRes = {
        status: (code: number) => {
          statusCode = code;
          return expressRes;
        },
        setHeader: (name: string, value: string) => {
          headers[name] = value;
          return expressRes;
        },
        json: (data: any) => {
          resolve(NextResponse.json(data, { status: statusCode, headers }));
        },
        send: (data: any) => {
          resolve(new NextResponse(data, { status: statusCode, headers }));
        },
        end: (data: any) => {
          resolve(new NextResponse(data, { status: statusCode, headers }));
        },
      };

      const next = (err?: any) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message || 'Internal error' }, { status: err.statusCode || 500 }));
        } else {
          resolve(NextResponse.json({ success: true }));
        }
      };

      controllerFn(expressReq as any, expressRes as any, next).catch(next);
    });
  };
}
