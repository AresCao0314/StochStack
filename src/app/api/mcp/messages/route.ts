import { createMcpServer } from '@/mcp/server';
import { type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

export const dynamic = 'force-dynamic';

/**
 * MCP Messages Endpoint
 * 
 * This endpoint receives JSON-RPC messages from MCP clients via POST.
 * It's used for client-to-server communication after the initial SSE connection.
 */
export async function POST(request: Request) {
  try {
    const message = (await request.json()) as JSONRPCMessage;
    
    // Create a transient server to handle this message
    // In production, you'd want to maintain session state
    const server = createMcpServer();
    
    // Create a mock transport to capture the response
    let responseMessage: JSONRPCMessage | null = null;
    
    const mockTransport = {
      send: (msg: JSONRPCMessage) => {
        responseMessage = msg;
        return Promise.resolve();
      },
      close: () => Promise.resolve(),
      onclose: null as (() => void) | null,
      onerror: null as ((error: Error) => void) | null,
      onmessage: null as ((message: JSONRPCMessage) => void) | null,
      sessionId: `session-${Date.now()}`,
      _started: true,
      start: () => Promise.resolve(),
    };

    await server.connect(mockTransport as unknown as import('@modelcontextprotocol/sdk/server/sse.js').SSEServerTransport);
    
    // Process the message
    if (mockTransport.onmessage) {
      mockTransport.onmessage(message);
    }

    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    if (responseMessage) {
      return Response.json(responseMessage);
    }

    return Response.json({ 
      jsonrpc: '2.0', 
      id: (message as { id?: string | number }).id,
      error: { code: -32603, message: 'Internal error: no response generated' }
    });

  } catch (error) {
    console.error('MCP message handling error:', error);
    return Response.json({
      jsonrpc: '2.0',
      id: null,
      error: { 
        code: -32700, 
        message: `Parse error: ${error instanceof Error ? error.message : String(error)}` 
      }
    }, { status: 400 });
  }
}
