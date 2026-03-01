import { handleMcpSseRequest } from '@/mcp/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * MCP SSE Endpoint
 * 
 * This endpoint provides Server-Sent Events for MCP (Model Context Protocol) clients.
 * Clients connect here to receive real-time updates and interact with the Ops Twin.
 * 
 * Usage with Claude Desktop:
 * 1. Add to claude_desktop_config.json:
 *    {
 *      "mcpServers": {
 *        "stochstack-ops-twin": {
 *          "url": "http://localhost:3000/api/mcp"
 *        }
 *      }
 *    }
 * 
 * 2. Restart Claude Desktop
 * 3. The Ops Twin tools will be available in Claude
 */
export async function GET(request: NextRequest) {
  const response = new Response(
    new ReadableStream({
      start(controller) {
        // Create a mock Node.js-compatible request/response
        const mockReq = {
          on: (event: string, cb: () => void) => {
            if (event === 'close') {
              request.signal.addEventListener('abort', cb);
            }
          },
        };

        const mockRes = {
          write: (data: string) => {
            try {
              controller.enqueue(new TextEncoder().encode(data));
              return true;
            } catch {
              return false;
            }
          },
          end: () => {
            try {
              controller.close();
            } catch {
              // Already closed
            }
          },
          on: () => {},
          once: () => {},
          emit: () => true,
        };

        // Handle the MCP SSE connection
        handleMcpSseRequest(
          mockReq as unknown as import('http').IncomingMessage,
          mockRes as unknown as import('http').ServerResponse
        ).catch((err) => {
          console.error('MCP SSE error:', err);
          controller.error(err);
        });
      },
      cancel() {
        // Cleanup handled by req.on('close')
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );

  return response;
}
